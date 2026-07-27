-- Messaging (system #9)
--
-- Direct client<->provider conversation for menial matters that do not warrant
-- a full service request. A conversation is scoped to a service request: its
-- participants are that request's client and assigned provider, plus staff (the
-- intermediary) for oversight and moderation.
--
-- Anonymity: the two parties never learn each other's identity. Messages store a
-- sender_role, so each side is rendered by role (You / Client / Provider /
-- BluBook staff), never by name. Content is not auto-filtered in this phase;
-- staff can read and delete messages for moderation.
--
-- Reuses is_staff(), current_client_id(), current_provider_id().

create type public.message_sender_role as enum ('client', 'provider', 'staff');

create table public.request_messages (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.service_requests (id) on delete cascade,
  sender_id   uuid references public.profiles (id) on delete set null,
  sender_role public.message_sender_role not null,
  body        text not null check (length(trim(body)) > 0),
  created_at  timestamptz not null default now()
);

comment on table public.request_messages is
  'Client<->provider messages scoped to a service request; rendered by role to preserve anonymity.';

create index request_messages_request_id_created_idx
  on public.request_messages (request_id, created_at);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.request_messages enable row level security;

-- Readable when the parent request is visible to the caller (staff see all,
-- a client its own, a provider its assigned requests).
create policy request_messages_select on public.request_messages
  for select to authenticated
  using (request_id in (select id from public.service_requests));

-- A participant (or staff) may post, only as themselves.
create policy request_messages_insert on public.request_messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (
      public.is_staff()
      or exists (
        select 1 from public.service_requests sr
        where sr.id = request_id
          and (sr.client_id = public.current_client_id() or sr.provider_id = public.current_provider_id())
      )
    )
  );

-- Staff may delete messages for moderation (e.g. content that breaches anonymity).
create policy request_messages_delete on public.request_messages
  for delete to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select, insert, delete on public.request_messages to authenticated;
grant all on public.request_messages to service_role;
