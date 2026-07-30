-- Messaging a work group
--
-- Messages were scoped to a service request, so a client could only talk to the
-- partner already assigned to a piece of work. A client can now message a work
-- group directly, without a request existing.
--
-- The conversation is handed to one partner in that group, chosen at random on
-- creation. Anonymity is unchanged: the client never learns which partner picked
-- it up, and messages are attributed by role, as in request threads.

create table public.work_group_conversations (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references public.clients (id) on delete cascade,
  work_group_id       uuid not null references public.service_groups (id) on delete cascade,
  -- Null when the group has no active partner to take it; staff can see these.
  assigned_provider_id uuid references public.providers (id) on delete set null,
  subject             text not null check (length(trim(subject)) > 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.work_group_conversations is
  'Client conversations addressed to a work group and handed to one partner in it.';

create index work_group_conversations_client_idx
  on public.work_group_conversations (client_id);
create index work_group_conversations_provider_idx
  on public.work_group_conversations (assigned_provider_id);

create trigger work_group_conversations_set_updated_at
  before update on public.work_group_conversations
  for each row execute function public.set_updated_at();

create table public.work_group_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.work_group_conversations (id) on delete cascade,
  sender_id       uuid references public.profiles (id) on delete set null,
  sender_role     public.message_sender_role not null,
  body            text not null check (length(trim(body)) > 0),
  created_at      timestamptz not null default now()
);

comment on table public.work_group_messages is
  'Messages within a work group conversation; rendered by role to preserve anonymity.';

create index work_group_messages_conversation_idx
  on public.work_group_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Random assignment on creation
-- ---------------------------------------------------------------------------
-- Runs as SECURITY DEFINER because a client cannot read the provider registry —
-- picking the partner must happen with elevated rights, exactly as routing does.

create or replace function public.assign_work_group_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Staff may hand a conversation to a specific partner; anyone else has the
  -- choice made for them, so a client cannot pick who reads it. Overwriting
  -- here rather than rejecting in RLS is deliberate: a BEFORE trigger runs
  -- before WITH CHECK sees the row, so the policy cannot police this column.
  if public.is_staff() and new.assigned_provider_id is not null then
    return new;
  end if;

  select p.id into new.assigned_provider_id
  from public.providers p
  join public.work_group_members m on m.provider_id = p.id
  where m.work_group_id = new.work_group_id
    and p.status = 'active'
  order by random()
  limit 1;

  return new;
end;
$$;

create trigger work_group_conversations_assign
  before insert on public.work_group_conversations
  for each row execute function public.assign_work_group_conversation();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.work_group_conversations enable row level security;
alter table public.work_group_messages enable row level security;

-- A client sees its own conversations, the partner sees those handed to it, and
-- staff see all as the intermediary.
create policy work_group_conversations_select on public.work_group_conversations
  for select to authenticated
  using (
    public.is_staff()
    or client_id = public.current_client_id()
    or assigned_provider_id = public.current_provider_id()
  );

-- A client opens a conversation for its own business only. The assigned partner
-- is not policed here — the trigger above overwrites it for non-staff, which is
-- what stops a client choosing who reads the conversation.
create policy work_group_conversations_insert on public.work_group_conversations
  for insert to authenticated
  with check (public.is_staff() or client_id = public.current_client_id());

-- Staff may reassign or retitle; participants do not.
create policy work_group_conversations_update on public.work_group_conversations
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Messages follow the conversation's visibility.
create policy work_group_messages_select on public.work_group_messages
  for select to authenticated
  using (conversation_id in (select id from public.work_group_conversations));

-- Only a participant may post, and only as themselves.
create policy work_group_messages_insert on public.work_group_messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (
      public.is_staff()
      or exists (
        select 1 from public.work_group_conversations c
        where c.id = conversation_id
          and (
            c.client_id = public.current_client_id()
            or c.assigned_provider_id = public.current_provider_id()
          )
      )
    )
  );

create policy work_group_messages_delete on public.work_group_messages
  for delete to authenticated
  using (public.is_staff());

grant select, insert, update on public.work_group_conversations to authenticated;
grant select, insert, delete on public.work_group_messages to authenticated;
grant all on public.work_group_conversations to service_role;
grant all on public.work_group_messages to service_role;
