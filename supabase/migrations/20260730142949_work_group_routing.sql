-- Work groups: route a request to a group of partners, then to one within it
--
-- Routing matched a request straight to any capable provider. Work adds an
-- intermediate layer: a request is sent to the work group that owns its service,
-- and is assigned to a partner belonging to that group.
--
-- service_groups (added for reporting, never populated) becomes the single work
-- group concept: a service names the group that owns it, and providers are
-- members of groups. The requests table already reads the group name, so that
-- column stops falling back to the service name.
--
-- Providers still need an active capability for the service — group membership
-- narrows the field, it does not replace capability.
--
-- Services with no group keep today's behaviour and match any capable provider,
-- so routing continues to work while groups are being set up.

comment on table public.service_groups is
  'Work groups: own a set of services and contain the partners who deliver them.';

-- ---------------------------------------------------------------------------
-- Membership
-- ---------------------------------------------------------------------------

create table public.work_group_members (
  work_group_id uuid not null references public.service_groups (id) on delete cascade,
  provider_id   uuid not null references public.providers (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (work_group_id, provider_id)
);

comment on table public.work_group_members is
  'Which partners belong to a work group; routing assigns within the group.';

create index work_group_members_provider_idx
  on public.work_group_members (provider_id);

alter table public.work_group_members enable row level security;

-- Staff maintain membership; a provider may see the groups it belongs to.
-- Routing runs SECURITY DEFINER, so it is unaffected by these policies.
create policy work_group_members_select on public.work_group_members
  for select to authenticated
  using (public.is_staff() or provider_id = public.current_provider_id());

create policy work_group_members_write on public.work_group_members
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

grant select, insert, update, delete on public.work_group_members to authenticated;
grant all on public.work_group_members to service_role;

-- ---------------------------------------------------------------------------
-- The group a request was sent to
-- ---------------------------------------------------------------------------
-- Recorded on the request when it is routed, so the tracker shows the group that
-- handled it even if the service is later moved to another group.

alter table public.service_requests
  add column work_group_id uuid references public.service_groups (id) on delete set null;

comment on column public.service_requests.work_group_id is
  'Work group the request was sent to, captured at routing.';

create index service_requests_work_group_idx
  on public.service_requests (work_group_id);

-- ---------------------------------------------------------------------------
-- Two-stage routing
-- ---------------------------------------------------------------------------

create or replace function public.route_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_service  uuid;
  v_status   public.request_status;
  v_group    uuid;
  v_provider uuid;
begin
  -- Authorized for staff, the service role (no auth.uid), or an internal
  -- routing call (app.routing_op set by reject_assignment).
  if not (
    public.is_staff()
    or (select auth.uid()) is null
    or current_setting('app.routing_op', true) = 'on'
  ) then
    raise exception 'Not authorized to route requests';
  end if;

  select service_id, status into v_service, v_status
  from public.service_requests where id = p_request_id for update;
  if not found then
    raise exception 'Request % not found', p_request_id;
  end if;
  if v_status not in ('new', 'awaiting_assignment') then
    raise exception 'Request % is not routable (status %)', p_request_id, v_status;
  end if;

  -- Stage one: the work group that owns the service.
  select group_id into v_group from public.services where id = v_service;

  perform set_config('app.routing_op', 'on', true);

  -- Record the group even when no partner is free, so the request waits in that
  -- group's queue rather than nowhere.
  update public.service_requests
    set work_group_id = v_group
    where id = p_request_id;

  -- Stage two: the least-loaded partner inside the group holding an active
  -- capability for the service. A service with no group matches any capable
  -- provider, preserving behaviour while groups are being set up.
  select p.id into v_provider
  from public.providers p
  join public.provider_capabilities pc on pc.provider_id = p.id
  where pc.service_id = v_service
    and pc.active
    and p.status = 'active'
    and (
      v_group is null
      or exists (
        select 1 from public.work_group_members m
        where m.work_group_id = v_group
          and m.provider_id = p.id
      )
    )
    and not exists (
      select 1 from public.request_assignments a
      where a.request_id = p_request_id
        and a.provider_id = p.id
        and a.status in ('rejected', 'withdrawn')
    )
  order by (
    select count(*) from public.service_requests r
    where r.provider_id = p.id and r.status in ('assigned', 'in_progress')
  ) asc, p.created_at asc
  limit 1;

  if v_provider is null then
    update public.service_requests set status = 'awaiting_assignment'
      where id = p_request_id and status = 'new';
    return null;
  end if;

  insert into public.request_assignments (request_id, provider_id, status)
    values (p_request_id, v_provider, 'offered');
  update public.service_requests
    set provider_id = v_provider, status = 'assigned'
    where id = p_request_id;

  return v_provider;
end;
$$;
