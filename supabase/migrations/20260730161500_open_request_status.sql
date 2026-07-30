-- 'open' — routed to a partner, not yet answered
--
-- Routing marked a request 'assigned' the moment a partner was offered it, so
-- the tracker could not tell work a partner had merely been offered from work
-- they had taken on. 'open' now covers the window between routing and the
-- partner's response; 'assigned' begins at acceptance.
--
-- The enum is rebuilt rather than extended with ALTER TYPE ... ADD VALUE, which
-- cannot be used in the same transaction that adds it.

alter type public.request_status rename to request_status_old;

create type public.request_status as enum (
  'new',
  'awaiting_assignment',
  'open',
  'assigned',
  'in_progress',
  'completed',
  'cancelled'
);

alter table public.service_requests
  alter column status drop default,
  alter column status type public.request_status
    using status::text::public.request_status,
  alter column status set default 'new';

alter table public.request_events
  alter column from_status type public.request_status
    using from_status::text::public.request_status,
  alter column to_status type public.request_status
    using to_status::text::public.request_status;

drop type public.request_status_old;

-- A request whose offer is still unanswered was never truly assigned.
update public.service_requests as request
set status = 'open'
where request.status = 'assigned'
  and exists (
    select 1 from public.request_assignments as assignment
    where assignment.request_id = request.id
      and assignment.status = 'offered'
  );

-- ---------------------------------------------------------------------------
-- route_request: leave the request 'open' for the offered partner to answer
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
  -- Unanswered offers ('open') count towards load, so a partner is not handed
  -- an unbounded queue of work they have yet to respond to.
  order by (
    select count(*) from public.service_requests r
    where r.provider_id = p.id
      and r.status in ('open', 'assigned', 'in_progress')
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
    set provider_id = v_provider, status = 'open'
    where id = p_request_id;

  return v_provider;
end;
$$;

-- ---------------------------------------------------------------------------
-- accept_assignment: acceptance is what moves the request to 'assigned'
-- ---------------------------------------------------------------------------

create or replace function public.accept_assignment(p_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.request_assignments;
begin
  select * into a from public.request_assignments where id = p_assignment_id for update;
  if not found then
    raise exception 'Assignment % not found', p_assignment_id;
  end if;
  if not (
    public.is_staff()
    or (select auth.uid()) is null
    or a.provider_id = public.current_provider_id()
  ) then
    raise exception 'Not authorized';
  end if;
  if a.status <> 'offered' then
    raise exception 'Assignment is not open (status %)', a.status;
  end if;

  update public.request_assignments
    set status = 'accepted', responded_at = now()
    where id = p_assignment_id;

  -- The partner has taken the work on; the provider moves it to in_progress
  -- when work begins (allowed by RLS, as it owns the request).
  update public.service_requests
    set status = 'assigned'
    where id = a.request_id and status = 'open';
end;
$$;
