-- The daily task reminder sweep.
--
-- Follows the shape of the overdue request sweep: an internal function the
-- scheduler calls and nobody else can, because execute is revoked from public
-- and never granted to authenticated. A scheduled job carries no JWT, so
-- auth.uid() is null under cron and any is_staff()-style guard would be false.
--
-- Two passes, because a task can be reminded and later go overdue, and those
-- are different things to tell somebody. Each is stamped so it happens once.

create or replace function public.run_task_reminder_sweep()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raised integer := 0;
  v_count  integer := 0;
begin
  -- 1. Reminders the client asked for.
  with due_reminders as (
    select t.id, t.title, t.due_on, c.primary_profile_id as recipient_id
    from public.client_tasks t
    join public.clients c on c.id = t.client_id
    where t.status <> 'done'
      and t.remind_on is not null
      and t.remind_on <= current_date
      and t.reminded_at is null
      and c.primary_profile_id is not null
  ),
  raised as (
    insert into public.notifications (recipient_id, type, urgent, title, body, task_id)
    select
      d.recipient_id,
      'task_reminder',
      false,
      d.title,
      case
        when d.due_on is null then 'A reminder you set on your task board.'
        when d.due_on = current_date then 'Due today.'
        when d.due_on < current_date
          then 'Was due ' || to_char(d.due_on, 'DD Mon YYYY') || '.'
        else 'Due ' || to_char(d.due_on, 'DD Mon YYYY') || '.'
      end,
      d.id
    from due_reminders d
    returning task_id
  )
  update public.client_tasks t
  set reminded_at = now()
  from raised r
  where t.id = r.task_id;

  get diagnostics v_count = row_count;
  v_raised := v_raised + v_count;

  -- 2. Tasks that have gone past their due date and are still open. Urgent,
  --    because the notifications tab gives urgent precedence and a missed
  --    deadline is the one thing on this board that cannot be recovered.
  with gone_overdue as (
    select t.id, t.title, t.due_on, c.primary_profile_id as recipient_id
    from public.client_tasks t
    join public.clients c on c.id = t.client_id
    where t.status <> 'done'
      and t.due_on is not null
      and t.due_on < current_date
      and t.overdue_notified_at is null
      and c.primary_profile_id is not null
  ),
  raised as (
    insert into public.notifications (recipient_id, type, urgent, title, body, task_id)
    select
      o.recipient_id,
      'task_reminder',
      true,
      o.title || ' is overdue',
      'This was due ' || to_char(o.due_on, 'DD Mon YYYY') || ' and is still open.',
      o.id
    from gone_overdue o
    returning task_id
  )
  update public.client_tasks t
  set overdue_notified_at = now()
  from raised r
  where t.id = r.task_id;

  get diagnostics v_count = row_count;
  v_raised := v_raised + v_count;

  return v_raised;
end;
$$;

comment on function public.run_task_reminder_sweep is
  'Raises task reminders and overdue notices once each. Called by pg_cron; not reachable by an authenticated caller.';

revoke all on function public.run_task_reminder_sweep from public;

-- Unschedule first so re-running this migration does not leave two jobs racing
-- each other, both stamping the same rows.
do $$
begin
  perform cron.unschedule('blubook-task-reminders');
exception when others then
  null; -- no such job yet, which is the normal case
end $$;

-- 04:00 UTC is 06:00 in Johannesburg, so a reminder is waiting at the start of
-- the working day rather than arriving in the middle of it. The overdue request
-- sweep runs at 06:00 UTC; staggering them keeps the two off the same tick.
select cron.schedule(
  'blubook-task-reminders',
  '0 4 * * *',
  $$select public.run_task_reminder_sweep();$$
);
