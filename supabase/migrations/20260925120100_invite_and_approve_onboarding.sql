-- Onboarding: staff invite, client completes, one staff approval.
--
-- 1. Operations or sales admin invite a client by email. The invitation holds
--    only a SHA-256 digest of a single-use token; the usable token exists only
--    in the link that is emailed. It expires after seven days.
-- 2. The client opens the link, completes the onboarding wizard and chooses
--    their own password. Their login, business record, work-group intake and
--    chosen package are stored, and the client is left 'pending'. Nothing is
--    live: no package, no requests, nothing routed to a partner.
-- 3. Operations or sales admin approve the case on the onboarding queue. One
--    function, in one transaction, activates the client, snapshots the
--    package, raises the initial requests, routes them, and opens the
--    compliance checklist. The application then delivers the document pack
--    and the welcome and compliance threads.
--
-- Routing refuses any client that is not active, so step 3 is the only way
-- work reaches a partner, whatever path a request was raised by.

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------

create table public.client_invitations (
  id           uuid primary key default gen_random_uuid(),
  -- Stored lower-cased and trimmed, so the account created from it and any
  -- lookup by address agree without every caller normalising.
  email        text not null
    check (email = lower(btrim(email)) and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  -- What staff call the business, for their own list. The client enters the
  -- legal details themselves; this is never copied onto the client record.
  business_name text check (business_name is null or btrim(business_name) <> ''),
  token_hash   text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  invited_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '7 days'),
  sent_at      timestamptz,
  revoked_at   timestamptz,
  -- Set when a submission starts and cleared if it rolls back: two tabs
  -- submitting the same link cannot both create an account.
  claimed_at   timestamptz,
  accepted_at  timestamptz,
  client_id    uuid references public.clients (id) on delete set null,

  constraint client_invitations_accepted_has_client
    check (accepted_at is null or client_id is not null)
);

comment on table public.client_invitations is
  'Single-use, expiring invitations for a client to complete their own onboarding. Only a digest of the token is stored.';
comment on column public.client_invitations.token_hash is
  'SHA-256 hex digest of the one-time token. The token itself exists only in the emailed link.';

create index client_invitations_email_idx on public.client_invitations (email);
create index client_invitations_created_idx on public.client_invitations (created_at desc);

alter table public.client_invitations enable row level security;

-- The invitation list is an operations surface. The client-facing side never
-- reads this table through the API: the invite page and its submission look a
-- token up server-side, by digest, with the service role.
create policy client_invitations_staff_select on public.client_invitations
  for select to authenticated
  using (public.has_staff_role('operations', 'sales_admin'));

create policy client_invitations_staff_insert on public.client_invitations
  for insert to authenticated
  with check (
    public.has_staff_role('operations', 'sales_admin')
    and invited_by = (select auth.uid())
  );

create policy client_invitations_staff_update on public.client_invitations
  for update to authenticated
  using (public.has_staff_role('operations', 'sales_admin'))
  with check (public.has_staff_role('operations', 'sales_admin'));

revoke all on public.client_invitations from anon;
grant select, insert, update on public.client_invitations to authenticated;
grant all on public.client_invitations to service_role;

-- ---------------------------------------------------------------------------
-- The pending onboarding case
-- ---------------------------------------------------------------------------
-- A submitted-but-unapproved case is onboardings.status = 'in_progress' with
-- submitted_at set. The package the client chose is kept as the assembly the
-- application resolved at submission — package meta plus one snapshot per
-- line item — so approval activates exactly what the client saw, and the
-- package resolution logic exists once, in the application.

alter table public.onboardings
  add column submitted_at timestamptz,
  add column requested_package jsonb
    check (requested_package is null or jsonb_typeof(requested_package) = 'object'),
  add column approved_at timestamptz,
  add column approved_by uuid references public.profiles (id) on delete set null;

comment on column public.onboardings.requested_package is
  'The package assembly chosen at submission: {basePackageId, meta, snapshots}. Activated by approve_client_onboarding().';
comment on column public.onboardings.approved_at is
  'When staff approved the client and it went live. Null while the case awaits approval.';

-- ---------------------------------------------------------------------------
-- Routing refuses clients that are not active
-- ---------------------------------------------------------------------------
-- Same body as 20260730161500_open_request_status.sql, plus the client check.

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
  v_client_status public.client_status;
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

  select r.service_id, r.status, c.status
    into v_service, v_status, v_client_status
  from public.service_requests r
  join public.clients c on c.id = r.client_id
  where r.id = p_request_id
  for update of r;
  if not found then
    raise exception 'Request % not found', p_request_id;
  end if;
  if v_status not in ('new', 'awaiting_assignment') then
    raise exception 'Request % is not routable (status %)', p_request_id, v_status;
  end if;
  -- A pending client has not been approved, and a suspended one no longer
  -- may be served. Neither reaches a partner.
  if v_client_status <> 'active' then
    raise exception 'Request % belongs to a client that is not active', p_request_id;
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
-- Approval: the one step that makes a client live
-- ---------------------------------------------------------------------------

create or replace function public.approve_client_onboarding(p_onboarding_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_onboarding public.onboardings%rowtype;
  v_client public.clients%rowtype;
  v_meta jsonb;
  v_snapshot jsonb;
  v_package_id uuid;
  v_snapshot_id uuid;
  v_request_id uuid;
  v_service_ids uuid[] := '{}';
  v_checklist_items integer;
begin
  if not public.has_staff_role('operations', 'sales_admin') then
    raise exception 'Only operations or sales admin can approve a client';
  end if;

  select * into v_onboarding
  from public.onboardings
  where id = p_onboarding_id
  for update;
  if not found then
    raise exception 'Onboarding case not found';
  end if;
  if v_onboarding.approved_at is not null then
    raise exception 'This client has already been approved';
  end if;
  if v_onboarding.submitted_at is null or v_onboarding.requested_package is null then
    raise exception 'This onboarding has not been submitted for approval';
  end if;

  select * into v_client
  from public.clients
  where id = v_onboarding.client_id
  for update;
  if not found or v_client.status <> 'pending' then
    raise exception 'Only a pending client can be approved';
  end if;

  v_meta := v_onboarding.requested_package -> 'meta';
  if v_meta is null
     or jsonb_typeof(v_onboarding.requested_package -> 'snapshots') <> 'array'
     or jsonb_array_length(v_onboarding.requested_package -> 'snapshots') = 0 then
    raise exception 'The package chosen for this client is incomplete';
  end if;

  -- Active first: routing refuses a client that is not.
  update public.clients set status = 'active' where id = v_client.id;

  insert into public.client_packages (
    client_id, onboarding_id, type, source_package_id, tier, name, total_price, billing_interval
  ) values (
    v_client.id,
    v_onboarding.id,
    (v_meta ->> 'type')::public.package_type,
    nullif(v_onboarding.requested_package ->> 'basePackageId', '')::uuid,
    nullif(v_meta ->> 'tier', '')::public.service_tier,
    v_meta ->> 'name',
    (v_meta ->> 'total_price')::numeric,
    nullif(v_meta ->> 'billing_interval', '')::public.billing_interval
  )
  returning id into v_package_id;

  -- Every item is snapshotted; a request is raised and routed only where a
  -- partner has to act. created_by on each request is the approver, through
  -- the set_request_reference trigger's auth.uid() default.
  for v_snapshot in
    select value from jsonb_array_elements(v_onboarding.requested_package -> 'snapshots')
  loop
    insert into public.client_package_line_items (
      client_package_id, source_line_item_id, name, tier, unit_price, quantity, fulfilment_mode
    ) values (
      v_package_id,
      nullif(v_snapshot ->> 'source_line_item_id', '')::uuid,
      v_snapshot ->> 'name',
      (v_snapshot ->> 'tier')::public.service_tier,
      (v_snapshot ->> 'unit_price')::numeric,
      coalesce((v_snapshot ->> 'quantity')::integer, 1),
      (v_snapshot ->> 'fulfilment_mode')::public.fulfilment_mode
    )
    returning id into v_snapshot_id;

    v_service_ids := v_service_ids || (v_snapshot ->> 'service_id')::uuid;

    if v_snapshot ->> 'fulfilment_mode' = 'service_request' then
      insert into public.service_requests (
        reference, origin, client_id, service_id, source_line_item_id, title
      ) values (
        '', 'system', v_client.id, (v_snapshot ->> 'service_id')::uuid, v_snapshot_id, v_snapshot ->> 'name'
      )
      returning id into v_request_id;

      perform public.route_request(v_request_id);
    end if;
  end loop;

  -- The compliance checklist, from whichever document types are active.
  insert into public.onboarding_documents (onboarding_id, document_type_id)
  select v_onboarding.id, t.id
  from public.compliance_document_types t
  where t.active;
  get diagnostics v_checklist_items = row_count;

  update public.onboardings set
    status = case when v_checklist_items > 0 then 'awaiting_documents' else 'completed' end::public.onboarding_status,
    completed_at = case when v_checklist_items > 0 then null else now() end,
    approved_at = now(),
    approved_by = (select auth.uid())
  where id = v_onboarding.id;

  return jsonb_build_object(
    'client_id', v_client.id,
    'client_profile_id', v_client.primary_profile_id,
    'business_name', v_client.business_name,
    'client_package_id', v_package_id,
    'service_ids', to_jsonb(v_service_ids),
    'checklist_items', v_checklist_items
  );
end;
$$;

comment on function public.approve_client_onboarding(uuid) is
  'Operations or sales admin: activates a pending client, snapshots its chosen package, raises and routes the initial requests and opens the compliance checklist, in one transaction.';

revoke all on function public.approve_client_onboarding(uuid) from public, anon;
grant execute on function public.approve_client_onboarding(uuid) to authenticated, service_role;
