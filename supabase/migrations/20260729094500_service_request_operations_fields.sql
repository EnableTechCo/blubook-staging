-- Operational fields used by the customer, provider and staff service-request
-- dashboards. Reporting values such as fiscal periods and SLA variance remain
-- derived from the source timestamps rather than duplicated on each request.

-- ---------------------------------------------------------------------------
-- Service work groups
-- ---------------------------------------------------------------------------

create table public.service_groups (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null unique,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.service_groups is
  'Operational work groups used to organise services for request reporting.';

create trigger service_groups_set_updated_at
  before update on public.service_groups
  for each row execute function public.set_updated_at();

alter table public.service_groups enable row level security;

create policy service_groups_select on public.service_groups
  for select to authenticated
  using (active or public.is_staff());

create policy service_groups_write on public.service_groups
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

grant select, insert, update, delete on public.service_groups to authenticated;
grant all on public.service_groups to service_role;

alter table public.services
  add column group_id uuid references public.service_groups (id) on delete set null;

create index services_group_id_idx on public.services (group_id);

-- ---------------------------------------------------------------------------
-- External references and request classification
-- ---------------------------------------------------------------------------

alter table public.clients
  add column external_reference text unique;

comment on column public.clients.external_reference is
  'Optional customer identifier from an external operational system.';

alter table public.service_requests
  add column request_type text not null default 'general'
    check (length(trim(request_type)) > 0),
  add column partner_work_order_reference text;

comment on column public.service_requests.request_type is
  'Operational request classification, such as general.';

comment on column public.service_requests.partner_work_order_reference is
  'Optional work-order identifier supplied by the assigned service partner.';

create unique index service_requests_partner_work_order_unique
  on public.service_requests (provider_id, partner_work_order_reference)
  where provider_id is not null and partner_work_order_reference is not null;

-- ---------------------------------------------------------------------------
-- SLA metadata
-- ---------------------------------------------------------------------------

alter table public.request_schedules
  add column sla_started_at timestamptz,
  add column sla_target_business_days integer
    check (sla_target_business_days is null or sla_target_business_days > 0);

update public.request_schedules as schedule
set
  sla_started_at = request.created_at,
  sla_target_business_days = service.default_turnaround_days
from public.service_requests as request
join public.services as service on service.id = request.service_id
where request.id = schedule.request_id;

alter table public.request_schedules
  alter column sla_started_at set default now(),
  alter column sla_started_at set not null;

comment on column public.request_schedules.sla_started_at is
  'Timestamp from which the request SLA is measured.';

comment on column public.request_schedules.sla_target_business_days is
  'Snapshot of the SLA target in business days for operational reporting.';

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
  select default_turnaround_days into v_turnaround
  from public.services where id = new.service_id;

  if new.origin = 'system' then
    v_type := 'static';
    if v_turnaround is not null then
      v_due := new.created_at + make_interval(days => v_turnaround);
    end if;
  else
    v_type := 'variable';
    v_due := null;
  end if;

  insert into public.request_schedules (
    request_id,
    eta_type,
    due_at,
    sla_started_at,
    sla_target_business_days
  )
  values (
    new.id,
    v_type,
    v_due,
    new.created_at,
    v_turnaround
  );

  return new;
end;
$$;
