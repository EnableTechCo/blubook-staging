-- ETA & scheduling (system #7)
--
-- Owns time expectations against requests. Every request carries an ETA in a
-- 1:1 request_schedules row, auto-created on request creation:
--   * system-generated requests get a STATIC ETA, computed from the service's
--     default turnaround (created_at + turnaround days);
--   * client/provider-generated requests get a VARIABLE ETA, set and adjusted
--     per request.
-- Static ETAs are rule-driven and cannot be hand-edited by non-staff.
--
-- Reuses is_staff() and set_updated_at(); references services and
-- service_requests.

-- ---------------------------------------------------------------------------
-- Catalogue: default turnaround per service (drives static ETAs)
-- ---------------------------------------------------------------------------

alter table public.services
  add column default_turnaround_days integer
    check (default_turnaround_days is null or default_turnaround_days > 0);

comment on column public.services.default_turnaround_days is
  'Standard turnaround in days; the basis for static ETAs on system requests.';

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------

create type public.eta_type as enum ('static', 'variable');

-- ---------------------------------------------------------------------------
-- request_schedules (1:1 with service_requests)
-- ---------------------------------------------------------------------------

create table public.request_schedules (
  request_id uuid primary key references public.service_requests (id) on delete cascade,
  eta_type   public.eta_type not null,
  due_at     timestamptz,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.request_schedules is
  'Per-request ETA: static (rule-driven) for system requests, variable otherwise.';

create index request_schedules_due_at_idx on public.request_schedules (due_at);

create trigger request_schedules_set_updated_at
  before update on public.request_schedules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a schedule for every request
-- ---------------------------------------------------------------------------

create or replace function public.create_request_schedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_turnaround integer;
  v_due        timestamptz;
  v_type       public.eta_type;
begin
  if new.origin = 'system' then
    v_type := 'static';
    select default_turnaround_days into v_turnaround
    from public.services where id = new.service_id;
    if v_turnaround is not null then
      v_due := new.created_at + make_interval(days => v_turnaround);
    end if;
  else
    v_type := 'variable';
    v_due := null;
  end if;

  insert into public.request_schedules (request_id, eta_type, due_at)
  values (new.id, v_type, v_due);

  return new;
end;
$$;

create trigger service_requests_create_schedule
  after insert on public.service_requests
  for each row execute function public.create_request_schedule();

-- Backfill any requests that predate this migration.
insert into public.request_schedules (request_id, eta_type, due_at)
select
  sr.id,
  case when sr.origin = 'system' then 'static'::public.eta_type
       else 'variable'::public.eta_type end,
  case when sr.origin = 'system' and s.default_turnaround_days is not null
       then sr.created_at + make_interval(days => s.default_turnaround_days)
       else null end
from public.service_requests sr
left join public.services s on s.id = sr.service_id
on conflict (request_id) do nothing;

-- ---------------------------------------------------------------------------
-- Guard: eta_type immutable; static ETAs editable only by staff
-- ---------------------------------------------------------------------------

create or replace function public.guard_request_schedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.eta_type is distinct from old.eta_type then
    raise exception 'eta_type cannot be changed';
  end if;

  if old.eta_type = 'static'
     and new.due_at is distinct from old.due_at
     and (select auth.uid()) is not null and not public.is_staff() then
    raise exception 'Static ETAs are rule-driven and cannot be changed';
  end if;

  return new;
end;
$$;

create trigger request_schedules_guard
  before update on public.request_schedules
  for each row execute function public.guard_request_schedule();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- A schedule is visible/editable exactly when its request is. The subqueries
-- inherit service_requests' own RLS, so staff/client/provider scoping is
-- reused. Rows are created by the SECURITY DEFINER trigger, not users.

alter table public.request_schedules enable row level security;

create policy request_schedules_select on public.request_schedules
  for select to authenticated
  using (request_id in (select id from public.service_requests));

-- Update: staff any; a client its own request's ETA; the assigned provider its
-- request's ETA. The guard trigger keeps static ETAs staff-only.
create policy request_schedules_update on public.request_schedules
  for update to authenticated
  using (
    public.is_staff()
    or request_id in (
      select id from public.service_requests
      where client_id = public.current_client_id()
         or provider_id = public.current_provider_id()
    )
  )
  with check (
    public.is_staff()
    or request_id in (
      select id from public.service_requests
      where client_id = public.current_client_id()
         or provider_id = public.current_provider_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select, update on public.request_schedules to authenticated;
grant all on public.request_schedules to service_role;
