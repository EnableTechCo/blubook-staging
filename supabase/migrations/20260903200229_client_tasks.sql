-- The client's own task board.
--
-- Deliberately standalone. A task carries no foreign key to a service request,
-- quotation or document, because the board is the client's own working memory
-- rather than a second view of platform state. The moment a task points at a
-- request, someone has to decide what happens to the task when the request is
-- cancelled, and the board stops being the client's to keep.
--
-- Private in the strongest sense available here: no staff policy at all, the
-- same rule the letterhead and quotation documents follow. A client writing
-- "chase the Mokoena invoice, they are stalling" is not writing it for BluBook
-- to read.

create type public.task_status as enum ('todo', 'in_progress', 'done');

comment on type public.task_status is
  'The three columns of the client task board.';

create table public.client_tasks (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients (id) on delete cascade,

  title       text not null,
  notes       text,
  status      public.task_status not null default 'todo',

  -- Both dates, not timestamps. The reminder sweep runs once a day on pg_cron,
  -- so a task cannot honestly promise a reminder at a particular hour. Storing
  -- a timestamptz here would imply a precision the scheduler does not have.
  due_on      date,
  remind_on   date,

  -- Two independent once-only signals, tracked separately because they answer
  -- different questions. reminded_at is "you asked to be told on this date";
  -- overdue_notified_at is "the date passed and this is still open". A single
  -- flag would mean a task that reminded on Monday goes silent when it slips.
  -- Both are cleared when their governing date moves, which is what makes
  -- rescheduling actually reschedule.
  reminded_at        timestamptz,
  overdue_notified_at timestamptz,

  -- Manual ordering within a column. Sparse by design: new tasks land at the
  -- top and reordering rewrites one row rather than renumbering the column.
  position    integer not null default 0,

  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint client_tasks_title_not_blank check (btrim(title) <> ''),
  constraint client_tasks_title_length check (char_length(title) <= 200),
  constraint client_tasks_notes_length check (notes is null or char_length(notes) <= 2000),
  -- A reminder after the thing is due is not a reminder.
  constraint client_tasks_remind_not_after_due
    check (remind_on is null or due_on is null or remind_on <= due_on)
);

comment on table public.client_tasks is
  'The client''s own task board. Private to the client: no staff role can read it.';
comment on column public.client_tasks.remind_on is
  'Date the reminder sweep should raise an in-app notification. Date, not timestamp: the sweep is daily.';
comment on column public.client_tasks.reminded_at is
  'Set by the sweep once a reminder has been raised. Cleared when remind_on changes so a rescheduled task reminds again.';

-- The board reads one client's tasks grouped by column, and the sweep reads
-- across clients by remind_on. Two access patterns, two indexes.
create index client_tasks_board_idx
  on public.client_tasks (client_id, status, position desc, created_at desc);

create index client_tasks_due_reminder_idx
  on public.client_tasks (remind_on)
  where remind_on is not null and reminded_at is null;

-- Keep updated_at honest, and keep the two derived columns consistent with the
-- fields they follow. Doing this in a trigger rather than in the action means
-- it holds however the row is written.
create or replace function public.client_tasks_touch()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();

  -- Rescheduling re-arms the matching signal.
  if tg_op = 'UPDATE' and new.remind_on is distinct from old.remind_on then
    new.reminded_at := null;
  end if;
  if tg_op = 'UPDATE' and new.due_on is distinct from old.due_on then
    new.overdue_notified_at := null;
  end if;

  -- completed_at follows status rather than being set by hand, so the two can
  -- never disagree about whether a task is done.
  if new.status = 'done' and (tg_op = 'INSERT' or old.status is distinct from 'done') then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create trigger client_tasks_touch
  before insert or update on public.client_tasks
  for each row execute function public.client_tasks_touch();

alter table public.client_tasks enable row level security;

-- The client owns the board outright.
create policy client_tasks_client_all on public.client_tasks
  for all to authenticated
  using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());

-- No staff policy, and no partner policy. This is the point of the table, not
-- an omission: a staff member reading a client's private notes would be the
-- same failure as reading its letterhead banking details. Support work that
-- genuinely needs a task must go through the service request flow, which is
-- visible to both sides by design.

grant select, insert, update, delete on public.client_tasks to authenticated;
grant all on public.client_tasks to service_role;
