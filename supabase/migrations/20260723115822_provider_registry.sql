-- Provider registry (system #2)
--
-- Owns the record of each service provider and what they can deliver. This is
-- the source of truth routing reads to match work to a provider. Holds provider
-- identity (linked to a service_provider profile), their service capabilities,
-- and status.
--
-- Reuses is_staff() and set_updated_at() from the identity migration and
-- references services from the catalogue migration.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- Lifecycle of a provider. Routing only considers 'active' providers; new
-- providers start 'pending' until staff activate them.
create type public.provider_status as enum ('pending', 'active', 'suspended');

-- ---------------------------------------------------------------------------
-- providers
-- ---------------------------------------------------------------------------
-- One row per service provider, linked to its service_provider profile.

create table public.providers (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null unique references public.profiles (id) on delete cascade,
  business_name text not null,
  status        public.provider_status not null default 'pending',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.providers is
  'Service providers; the source of truth routing matches work against.';

create index providers_status_idx on public.providers (status);

-- ---------------------------------------------------------------------------
-- provider_capabilities
-- ---------------------------------------------------------------------------
-- Which services a provider can deliver. Routing matches a request's service to
-- providers with an active capability for it.

create table public.provider_capabilities (
  provider_id uuid not null references public.providers (id) on delete cascade,
  service_id  uuid not null references public.services (id) on delete restrict,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (provider_id, service_id)
);

comment on table public.provider_capabilities is
  'Services each provider can deliver; the routing match data.';

create index provider_capabilities_service_id_idx
  on public.provider_capabilities (service_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance (reuses public.set_updated_at)
-- ---------------------------------------------------------------------------

create trigger providers_set_updated_at
  before update on public.providers
  for each row execute function public.set_updated_at();

create trigger provider_capabilities_set_updated_at
  before update on public.provider_capabilities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Integrity guards
-- ---------------------------------------------------------------------------

-- A provider must link to a profile whose user_type is service_provider.
create or replace function public.guard_provider_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = new.profile_id and user_type = 'service_provider'
  ) then
    raise exception 'providers.profile_id must reference a service_provider profile';
  end if;
  return new;
end;
$$;

create trigger providers_guard_profile
  before insert or update of profile_id on public.providers
  for each row execute function public.guard_provider_profile();

-- Only staff may change a provider's status (no self-activation).
create or replace function public.guard_provider_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_staff() then
    return new;
  end if;
  if new.status is distinct from old.status then
    raise exception 'Only staff may change provider status';
  end if;
  return new;
end;
$$;

create trigger providers_guard_status
  before update on public.providers
  for each row execute function public.guard_provider_status();

-- ---------------------------------------------------------------------------
-- RLS helper: the current user's provider id (if any)
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so capability policies can resolve ownership without
-- entangling with the providers table's own RLS.

create or replace function public.current_provider_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.providers where profile_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Registry is internal: a provider sees and maintains its own record and
-- capabilities; staff manage everything. Clients have no direct access (they
-- learn their assigned provider through service requests, a later system).
-- Routing runs server-side via the service role, which bypasses RLS.

alter table public.providers enable row level security;
alter table public.provider_capabilities enable row level security;

-- providers: read own or staff; only staff create/delete; own or staff update
-- (status change on non-staff blocked by the guard trigger).
create policy providers_select on public.providers
  for select to authenticated
  using (profile_id = (select auth.uid()) or public.is_staff());
create policy providers_insert on public.providers
  for insert to authenticated
  with check (public.is_staff());
create policy providers_update on public.providers
  for update to authenticated
  using (profile_id = (select auth.uid()) or public.is_staff())
  with check (profile_id = (select auth.uid()) or public.is_staff());
create policy providers_delete on public.providers
  for delete to authenticated
  using (public.is_staff());

-- provider_capabilities: a provider manages its own; staff manage all.
create policy provider_capabilities_all on public.provider_capabilities
  for all to authenticated
  using (provider_id = public.current_provider_id() or public.is_staff())
  with check (provider_id = public.current_provider_id() or public.is_staff());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.providers to authenticated;
grant select, insert, update, delete on public.provider_capabilities to authenticated;
grant all on public.providers to service_role;
grant all on public.provider_capabilities to service_role;

revoke execute on function public.current_provider_id() from public;
grant execute on function public.current_provider_id() to authenticated;
