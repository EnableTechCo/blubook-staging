-- Service requests (system #5)
--
-- Owns the request record and its full lifecycle. Requests originate three
-- ways -- system-generated from package line-item snapshots, client-created,
-- and provider-created -- each issued its own identifier (SYS-/CLI-/PRV-).
-- Owns the status lifecycle from creation to completion and the tracking view
-- clients and providers rely on, backed by an append-only event trail.
--
-- Reuses is_staff(), current_client_id(), current_provider_id(),
-- set_updated_at(); references clients, services, providers, profiles, and the
-- client_package_line_items snapshots.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.request_origin as enum ('system', 'client', 'provider');

create type public.request_status as enum (
  'new', 'awaiting_assignment', 'assigned', 'in_progress', 'completed', 'cancelled'
);

-- ---------------------------------------------------------------------------
-- Per-origin identifier sequences
-- ---------------------------------------------------------------------------
-- Each origin has its own counter so references read SYS-000001, CLI-000001,
-- PRV-000001 independently.

create sequence public.request_ref_system_seq;
create sequence public.request_ref_client_seq;
create sequence public.request_ref_provider_seq;

-- ---------------------------------------------------------------------------
-- service_requests
-- ---------------------------------------------------------------------------

create table public.service_requests (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique,
  origin              public.request_origin not null,
  status              public.request_status not null default 'new',
  client_id           uuid not null references public.clients (id) on delete cascade,
  service_id          uuid not null references public.services (id) on delete restrict,
  -- Set for system-generated requests (the package line item they came from);
  -- null for ad-hoc client/provider requests. Nulled if the snapshot is removed.
  source_line_item_id uuid references public.client_package_line_items (id) on delete set null,
  -- Assigned provider; null until routing (system #6) assigns one.
  provider_id         uuid references public.providers (id) on delete set null,
  -- Who created it; null for system-generated.
  created_by          uuid references public.profiles (id) on delete set null,
  title               text not null,
  description         text,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.service_requests is
  'Service request records and their lifecycle; the platform''s central work item.';

create index service_requests_client_id_idx on public.service_requests (client_id);
create index service_requests_provider_id_idx on public.service_requests (provider_id);
create index service_requests_status_idx on public.service_requests (status);
-- Routing looks up unassigned requests by service.
create index service_requests_service_status_idx
  on public.service_requests (service_id, status);

-- ---------------------------------------------------------------------------
-- request_events
-- ---------------------------------------------------------------------------
-- Append-only trail of status transitions, written automatically by trigger.
-- Powers the tracking view and will feed Notifications (system #10).

create table public.request_events (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.service_requests (id) on delete cascade,
  from_status public.request_status,
  to_status   public.request_status not null,
  actor_id    uuid references public.profiles (id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);

comment on table public.request_events is
  'Append-only status-transition history for service requests.';

create index request_events_request_id_idx on public.request_events (request_id);

-- ---------------------------------------------------------------------------
-- Reference generation (before insert)
-- ---------------------------------------------------------------------------

create or replace function public.set_request_reference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n bigint;
  prefix text;
begin
  -- Default the creator to the current user (null for system/service-role).
  if new.created_by is null then
    new.created_by := (select auth.uid());
  end if;

  if new.reference is not null and new.reference <> '' then
    return new;
  end if;
  case new.origin
    when 'system' then
      n := nextval('public.request_ref_system_seq'); prefix := 'SYS';
    when 'client' then
      n := nextval('public.request_ref_client_seq'); prefix := 'CLI';
    when 'provider' then
      n := nextval('public.request_ref_provider_seq'); prefix := 'PRV';
  end case;
  new.reference := prefix || '-' || lpad(n::text, 6, '0');
  return new;
end;
$$;

create trigger service_requests_set_reference
  before insert on public.service_requests
  for each row execute function public.set_request_reference();

-- ---------------------------------------------------------------------------
-- Guard + timestamp bookkeeping (before update)
-- ---------------------------------------------------------------------------
-- Stamps completed_at on entry to 'completed', and blocks non-staff from
-- reassigning providers or altering identity fields. Detailed transition
-- validation is refined alongside Routing (system #6).

create or replace function public.guard_and_stamp_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at := now();
  end if;

  -- Guard only real authenticated non-staff users. The service role (routing /
  -- system generation) has no auth.uid() and is trusted to assign providers.
  if (select auth.uid()) is not null and not public.is_staff() then
    if new.provider_id is distinct from old.provider_id
       or new.client_id is distinct from old.client_id
       or new.origin is distinct from old.origin
       or new.reference is distinct from old.reference then
      raise exception 'Only staff may change assignment or request identity fields';
    end if;
  end if;

  return new;
end;
$$;

create trigger service_requests_guard_and_stamp
  before update on public.service_requests
  for each row execute function public.guard_and_stamp_request();

create trigger service_requests_set_updated_at
  before update on public.service_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Event logging (after insert / status change)
-- ---------------------------------------------------------------------------

create or replace function public.log_request_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.request_events (request_id, from_status, to_status, actor_id)
    values (new.id, null, new.status, (select auth.uid()));
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.request_events (request_id, from_status, to_status, actor_id)
    values (new.id, old.status, new.status, (select auth.uid()));
  end if;
  return new;
end;
$$;

create trigger service_requests_log_event
  after insert or update on public.service_requests
  for each row execute function public.log_request_event();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Visibility: staff see all; a client sees its own requests; a provider sees
-- requests assigned to it or that it created. System-generated requests are
-- created via the service role, which bypasses RLS.

alter table public.service_requests enable row level security;
alter table public.request_events enable row level security;

create policy service_requests_select on public.service_requests
  for select to authenticated
  using (
    public.is_staff()
    or client_id = public.current_client_id()
    or provider_id = public.current_provider_id()
    or created_by = (select auth.uid())
  );

-- Create: staff anything; a client for its own business; a provider ad-hoc.
-- Non-staff may not pre-assign a provider.
create policy service_requests_insert on public.service_requests
  for insert to authenticated
  with check (
    public.is_staff()
    or (origin = 'client' and client_id = public.current_client_id() and provider_id is null)
    or (origin = 'provider' and public.current_provider_id() is not null and provider_id is null)
  );

-- Update: staff anything; a client its own; a provider its assigned request.
-- The guard trigger stops non-staff from reassigning or altering identity.
create policy service_requests_update on public.service_requests
  for update to authenticated
  using (
    public.is_staff()
    or client_id = public.current_client_id()
    or provider_id = public.current_provider_id()
  )
  with check (
    public.is_staff()
    or client_id = public.current_client_id()
    or provider_id = public.current_provider_id()
  );

create policy service_requests_delete on public.service_requests
  for delete to authenticated
  using (public.is_staff());

-- request_events: readable if the parent request is; never written directly
-- (the logging trigger inserts as a SECURITY DEFINER function).
create policy request_events_select on public.request_events
  for select to authenticated
  using (
    public.is_staff()
    or request_id in (
      select id from public.service_requests
      where client_id = public.current_client_id()
         or provider_id = public.current_provider_id()
         or created_by = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.service_requests to authenticated;
grant select on public.request_events to authenticated;
grant all on public.service_requests to service_role;
grant all on public.request_events to service_role;
