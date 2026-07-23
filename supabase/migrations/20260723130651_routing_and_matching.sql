-- Routing & matching (system #6)
--
-- Owns the decision of which provider a request goes to. Matches a request to
-- an eligible provider by service capability (least-loaded first), records each
-- offer, and handles provider rejection (re-route, don't re-offer the same
-- provider) and the no-match case (request left awaiting_assignment).
--
-- Routing is invoked through route_request(); providers respond via
-- accept_assignment() / reject_assignment(). All three are SECURITY DEFINER.
--
-- Note on the guard: system #5's guard_and_stamp_request blocks non-staff from
-- changing provider_id. A provider rejecting must null it, so the trusted
-- routing functions set a transaction-local GUC (app.routing_op) that both the
-- guard and route_request's authorization honour. The guard is replaced here to
-- recognise it.

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------

create type public.assignment_status as enum (
  'offered', 'accepted', 'rejected', 'withdrawn'
);

-- ---------------------------------------------------------------------------
-- request_assignments
-- ---------------------------------------------------------------------------
-- One row per offer made to a provider for a request, with its outcome.

create table public.request_assignments (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.service_requests (id) on delete cascade,
  provider_id  uuid not null references public.providers (id) on delete cascade,
  status       public.assignment_status not null default 'offered',
  note         text,
  responded_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.request_assignments is
  'Offers made to providers for requests, with accept/reject outcomes.';

create index request_assignments_request_id_idx on public.request_assignments (request_id);
create index request_assignments_provider_id_idx on public.request_assignments (provider_id);

-- At most one live offer/assignment per request at a time.
create unique index request_assignments_one_active
  on public.request_assignments (request_id)
  where status in ('offered', 'accepted');

create trigger request_assignments_set_updated_at
  before update on public.request_assignments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Replace the request guard to honour the routing GUC
-- ---------------------------------------------------------------------------

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

  -- Skip the assignment/identity guard during a trusted routing operation.
  if current_setting('app.routing_op', true) is distinct from 'on'
     and (select auth.uid()) is not null and not public.is_staff() then
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

-- ---------------------------------------------------------------------------
-- route_request: pick the least-loaded eligible provider and offer the request
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

  -- Eligible = active provider with an active capability for the service, not
  -- already rejected/withdrawn for this request. Least-loaded first.
  select p.id into v_provider
  from public.providers p
  join public.provider_capabilities pc on pc.provider_id = p.id
  where pc.service_id = v_service
    and pc.active
    and p.status = 'active'
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

  perform set_config('app.routing_op', 'on', true);

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

-- ---------------------------------------------------------------------------
-- accept_assignment: the offered provider accepts
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
  -- The request stays 'assigned'; the provider moves it to in_progress when
  -- work begins (allowed by RLS, as it owns the request).
end;
$$;

-- ---------------------------------------------------------------------------
-- reject_assignment: the offered provider declines; re-route to the next
-- ---------------------------------------------------------------------------

create or replace function public.reject_assignment(p_assignment_id uuid, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  a      public.request_assignments;
  v_next uuid;
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
    set status = 'rejected', responded_at = now(), note = p_note
    where id = p_assignment_id;

  perform set_config('app.routing_op', 'on', true);
  update public.service_requests
    set provider_id = null, status = 'awaiting_assignment'
    where id = a.request_id;

  -- Try the next eligible provider (this one is now excluded).
  v_next := public.route_request(a.request_id);
  return v_next;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Read-only for users: staff see all; a provider sees its own offers; a client
-- sees offers on its own requests. All writes go through the routing functions
-- (SECURITY DEFINER), so there are no write policies.

alter table public.request_assignments enable row level security;

create policy request_assignments_select on public.request_assignments
  for select to authenticated
  using (
    public.is_staff()
    or provider_id = public.current_provider_id()
    or request_id in (
      select id from public.service_requests where client_id = public.current_client_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select on public.request_assignments to authenticated;
grant all on public.request_assignments to service_role;

revoke execute on function public.route_request(uuid) from public;
revoke execute on function public.accept_assignment(uuid) from public;
revoke execute on function public.reject_assignment(uuid, text) from public;
grant execute on function public.route_request(uuid) to authenticated, service_role;
grant execute on function public.accept_assignment(uuid) to authenticated, service_role;
grant execute on function public.reject_assignment(uuid, text) to authenticated, service_role;
