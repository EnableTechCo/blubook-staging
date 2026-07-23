-- Identity & access (system #1)
--
-- Owns accounts, authentication, and permission scopes for the three BluBook
-- user types: clients, service providers, and internal staff (sales/ops).
-- Establishes the per-user profile record and the RLS helper functions that
-- every later system references when deciding who may see what.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- The three top-level user types the platform serves.
create type public.user_type as enum ('client', 'service_provider', 'staff');

-- Sub-role for internal BluBook staff only. Null for clients and providers.
create type public.staff_role as enum ('sales', 'operations', 'admin');

-- Account lifecycle state, independent of authentication.
create type public.account_status as enum ('active', 'suspended');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- One row per auth.users record. Carries the user type and permission scope
-- the rest of the platform reads for access decisions. auth.users remains the
-- source of truth for credentials; email is mirrored here for convenience.

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  user_type   public.user_type not null,
  staff_role  public.staff_role,
  full_name   text,
  email       text,
  status      public.account_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- staff_role only applies to staff; non-staff must leave it null.
  constraint profiles_staff_role_scope check (
    user_type = 'staff' or staff_role is null
  )
);

comment on table public.profiles is
  'Per-user identity and permission scope for the three BluBook user types.';

create index profiles_user_type_idx on public.profiles (user_type);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profile provisioning on signup
-- ---------------------------------------------------------------------------
-- Creates the profile row when a new auth user is created, seeding user type
-- and name from the signup metadata. Defaults to 'client' when unspecified.
-- SECURITY DEFINER so it can write to public.profiles regardless of the
-- caller's RLS context.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, user_type, staff_role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'user_type')::public.user_type, 'client'),
    (new.raw_user_meta_data ->> 'staff_role')::public.staff_role,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS helper functions
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER + stable so policies can call them without recursing
-- through profiles' own RLS. These are the shared primitives later systems
-- reuse to gate access by user type.

create or replace function public.current_user_type()
returns public.user_type
language sql
stable
security definer
set search_path = ''
as $$
  select user_type from public.profiles where id = (select auth.uid());
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and user_type = 'staff'
  );
$$;

-- ---------------------------------------------------------------------------
-- Privilege-escalation guard
-- ---------------------------------------------------------------------------
-- A user may edit their own profile, but only staff may change the scope
-- fields (user_type, staff_role, status). Enforced by trigger because RLS
-- WITH CHECK cannot compare against the previous row.

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_staff() then
    return new;
  end if;

  if new.user_type is distinct from old.user_type
     or new.staff_role is distinct from old.staff_role
     or new.status is distinct from old.status then
    raise exception 'Only staff may change user_type, staff_role, or status';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Deny by default. Profiles are provisioned by the signup trigger, so there is
-- no INSERT policy for end users, and no DELETE policy (rows cascade from
-- auth.users). Privileged creation happens server-side via the service role.

alter table public.profiles enable row level security;

-- Read: own profile, or any profile if staff.
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_staff());

-- Update: own profile (scope fields guarded by trigger), or any if staff.
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_staff())
  with check (id = (select auth.uid()) or public.is_staff());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

revoke execute on function public.current_user_type() from public;
revoke execute on function public.is_staff() from public;
grant execute on function public.current_user_type() to authenticated;
grant execute on function public.is_staff() to authenticated;
