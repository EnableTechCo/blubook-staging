-- Stage 2: Sales review of the submitted core customer profile.
-- Existing customers keep their current approved state; new onboarding rows
-- enter review automatically. All changes go through a role-checked RPC.

alter table public.clients
  add column if not exists profile_version integer not null default 1
    check (profile_version > 0);

alter table public.onboardings
  add column if not exists sales_review_status text not null default 'approved'
    check (sales_review_status in ('awaiting_review', 'changes_requested', 'approved')),
  add column if not exists sales_review_note text,
  add column if not exists sales_reviewed_by uuid references public.profiles (id) on delete set null,
  add column if not exists sales_reviewed_at timestamptz,
  add column if not exists sales_reviewed_profile_version integer not null default 0;

alter table public.onboardings
  alter column sales_review_status set default 'awaiting_review';

update public.onboardings o
set sales_reviewed_profile_version = c.profile_version
from public.clients c
where c.id = o.client_id
  and o.sales_review_status = 'approved'
  and o.sales_reviewed_profile_version = 0;

create table public.onboarding_audit_events (
  id uuid primary key default gen_random_uuid(),
  onboarding_id uuid not null references public.onboardings (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  event_type text not null check (event_type in ('profile_updated', 'changes_requested', 'approved')),
  changed_fields text[] not null default '{}',
  note text,
create or replace function public.notify_sales_onboarding_review_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_name text;
begin
  if new.sales_review_status <> 'awaiting_review' then
    return new;
  end if;

  select business_name into v_business_name
  from public.clients
  where id = new.client_id;

  insert into public.notifications (recipient_id, type, title, body, urgent)
  select p.id,
    'onboarding_review',
    'Customer profile ready for review',
    coalesce(v_business_name, 'A customer profile') || ' is ready for Sales review.',
    false
  from public.profiles p
  where p.user_type = 'staff'
    and p.staff_role in ('sales_rep', 'sales_admin', 'admin')
    and p.status = 'active';

  return new;
end;
$$;
  created_at timestamptz not null default now()
);

create index onboarding_audit_events_case_idx
  on public.onboarding_audit_events (onboarding_id, created_at desc);

alter table public.onboarding_audit_events enable row level security;
revoke all on public.onboarding_audit_events from anon, authenticated;
grant all on public.onboarding_audit_events to service_role;

create or replace function public.reject_onboarding_audit_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Onboarding audit events are append-only';
end;
$$;

create trigger onboarding_audit_events_append_only
before update or delete on public.onboarding_audit_events
for each row execute function public.reject_onboarding_audit_event_mutation();

-- Sales roles can see the onboarding queue, but only operations/admin can
-- retrieve the compliance checklist and submitted files in the UI.
drop policy if exists onboardings_select on public.onboardings;
create policy onboardings_select on public.onboardings
  for select to authenticated
  using (
    client_id = public.current_client_id()
    or public.has_staff_role('operations', 'sales_admin', 'sales_rep')
  );

create or replace function public.review_onboarding_profile(
  p_onboarding_id uuid,
  p_action text,
  p_expected_profile_version integer,
  p_changes jsonb default '{}'::jsonb,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_onboarding public.onboardings%rowtype;
  v_client public.clients%rowtype;
  v_new_version integer;
  v_changed_fields text[] := '{}';
  v_material_change boolean := false;
  v_client_name text;
  v_notification_type public.notification_type;
  v_notification_title text;
  v_notification_body text;
begin
  if (select auth.uid()) is null
     or not public.has_staff_role('sales_rep', 'sales_admin') then
    raise exception 'Not authorized to review customer profiles';
  end if;

  if p_action is null or p_action not in ('save', 'changes_requested', 'approved') then
    raise exception 'Invalid review action';
  end if;
  if coalesce(jsonb_typeof(p_changes), 'object') <> 'object' then
    raise exception 'Profile changes must be an object';
  end if;
  if exists (
    select 1 from jsonb_object_keys(coalesce(p_changes, '{}'::jsonb)) as fields(field_name)
    where field_name not in (
      'business_name', 'registered_name', 'trading_name', 'entity_type',
      'registration_number', 'industry', 'primary_contact_job_title',
      'primary_contact_phone', 'billing_contact_name', 'billing_contact_email',
      'business_address_line_1', 'business_address_line_2', 'business_city',
      'business_province', 'business_postal_code', 'business_country',
      'billing_address_line_1', 'billing_address_line_2', 'billing_city',
      'billing_province', 'billing_postal_code', 'billing_country',
      'vat_status', 'vat_number'
    )
  ) then
    raise exception 'Profile contains fields that cannot be edited here';
  end if;
  if exists (
    select 1 from jsonb_each(coalesce(p_changes, '{}'::jsonb)) as item(field_name, field_value)
    where jsonb_typeof(item.field_value) not in ('string', 'null')
  ) then
    raise exception 'Profile fields must be text';
  end if;
  if p_action = 'changes_requested' and length(trim(coalesce(p_note, ''))) < 3 then
    raise exception 'Add a message explaining what the customer needs to update';
  end if;
  if length(coalesce(p_note, '')) > 1000 then
    raise exception 'The review message is too long';
  end if;

  select * into v_onboarding
  from public.onboardings
  where id = p_onboarding_id
  for update;
  if not found then raise exception 'Onboarding case not found'; end if;

  select * into v_client
  from public.clients
  where id = v_onboarding.client_id
  for update;
  if not found then raise exception 'Customer profile not found'; end if;
  if p_expected_profile_version is null
     or p_expected_profile_version <> v_client.profile_version then
    raise exception 'Profile changed since it was loaded. Refresh and try again';
  end if;

  if p_changes <> '{}'::jsonb then
    if p_changes ? 'business_name' and nullif(trim(p_changes->>'business_name'), '') is null
       or p_changes ? 'registered_name' and nullif(trim(p_changes->>'registered_name'), '') is null
       or p_changes ? 'trading_name' and nullif(trim(p_changes->>'trading_name'), '') is null then
      raise exception 'Business and registered names cannot be blank';
    end if;

    select coalesce(array_agg(item.field_name order by item.field_name), '{}')
      into v_changed_fields
    from jsonb_each(p_changes) as item(field_name, field_value)
    where (to_jsonb(v_client)->>item.field_name) is distinct from
      nullif(trim(item.field_value #>> '{}'), '');

    v_material_change := v_changed_fields && array[
      'business_name', 'registered_name', 'trading_name', 'entity_type',
      'registration_number', 'vat_status', 'vat_number'
    ];

    if cardinality(v_changed_fields) > 0 then
      update public.clients c set
        business_name = case
        when p_changes ? 'business_name' then trim(p_changes->>'business_name')
        when p_changes ? 'trading_name' then trim(p_changes->>'trading_name')
        else c.business_name end,
      registered_name = case when p_changes ? 'registered_name'
        then trim(p_changes->>'registered_name') else c.registered_name end,
      trading_name = case
        when p_changes ? 'trading_name' then trim(p_changes->>'trading_name')
        when p_changes ? 'business_name' then trim(p_changes->>'business_name')
        else c.trading_name end,
      entity_type = case when p_changes ? 'entity_type'
        then nullif(trim(p_changes->>'entity_type'), '')::public.client_entity_type else c.entity_type end,
      registration_number = case when p_changes ? 'registration_number'
        then nullif(trim(p_changes->>'registration_number'), '') else c.registration_number end,
      industry = case when p_changes ? 'industry'
        then nullif(trim(p_changes->>'industry'), '') else c.industry end,
      primary_contact_job_title = case when p_changes ? 'primary_contact_job_title'
        then nullif(trim(p_changes->>'primary_contact_job_title'), '') else c.primary_contact_job_title end,
      primary_contact_phone = case when p_changes ? 'primary_contact_phone'
        then nullif(trim(p_changes->>'primary_contact_phone'), '') else c.primary_contact_phone end,
      billing_contact_name = case when p_changes ? 'billing_contact_name'
        then nullif(trim(p_changes->>'billing_contact_name'), '') else c.billing_contact_name end,
      billing_contact_email = case when p_changes ? 'billing_contact_email'
        then nullif(trim(p_changes->>'billing_contact_email'), '') else c.billing_contact_email end,
      business_address_line_1 = case when p_changes ? 'business_address_line_1'
        then nullif(trim(p_changes->>'business_address_line_1'), '') else c.business_address_line_1 end,
      business_address_line_2 = case when p_changes ? 'business_address_line_2'
        then nullif(trim(p_changes->>'business_address_line_2'), '') else c.business_address_line_2 end,
      business_city = case when p_changes ? 'business_city'
        then nullif(trim(p_changes->>'business_city'), '') else c.business_city end,
      business_province = case when p_changes ? 'business_province'
        then nullif(trim(p_changes->>'business_province'), '') else c.business_province end,
      business_postal_code = case when p_changes ? 'business_postal_code'
        then nullif(trim(p_changes->>'business_postal_code'), '') else c.business_postal_code end,
      business_country = case when p_changes ? 'business_country'
        then nullif(trim(p_changes->>'business_country'), '') else c.business_country end,
      billing_address_line_1 = case when p_changes ? 'billing_address_line_1'
        then nullif(trim(p_changes->>'billing_address_line_1'), '') else c.billing_address_line_1 end,
      billing_address_line_2 = case when p_changes ? 'billing_address_line_2'
        then nullif(trim(p_changes->>'billing_address_line_2'), '') else c.billing_address_line_2 end,
      billing_city = case when p_changes ? 'billing_city'
        then nullif(trim(p_changes->>'billing_city'), '') else c.billing_city end,
      billing_province = case when p_changes ? 'billing_province'
        then nullif(trim(p_changes->>'billing_province'), '') else c.billing_province end,
      billing_postal_code = case when p_changes ? 'billing_postal_code'
        then nullif(trim(p_changes->>'billing_postal_code'), '') else c.billing_postal_code end,
      billing_country = case when p_changes ? 'billing_country'
        then nullif(trim(p_changes->>'billing_country'), '') else c.billing_country end,
      vat_status = case when p_changes ? 'vat_status'
        then nullif(trim(p_changes->>'vat_status'), '')::public.vat_status else c.vat_status end,
      vat_number = case when p_changes ? 'vat_number'
        then nullif(trim(p_changes->>'vat_number'), '') else c.vat_number end,
      profile_version = c.profile_version + 1,
      updated_at = now()
    where c.id = v_client.id
    returning c.profile_version into v_new_version;
    else
      v_new_version := v_client.profile_version;
    end if;

    if v_onboarding.sales_review_status = 'approved' and v_material_change then
      update public.onboardings set
        sales_review_status = 'awaiting_review',
        sales_review_note = null,
        sales_reviewed_by = null,
        sales_reviewed_at = null,
        sales_reviewed_profile_version = 0
      where id = v_onboarding.id;
    end if;

    if cardinality(v_changed_fields) > 0 then
      insert into public.onboarding_audit_events
        (onboarding_id, client_id, actor_id, event_type, changed_fields)
      values
        (v_onboarding.id, v_client.id, (select auth.uid()), 'profile_updated', v_changed_fields);
    end if;
  else
    v_new_version := v_client.profile_version;
  end if;

  if p_action = 'changes_requested' then
    update public.onboardings set
      sales_review_status = 'changes_requested',
      sales_review_note = trim(p_note),
      sales_reviewed_by = (select auth.uid()),
      sales_reviewed_at = now(),
      sales_reviewed_profile_version = 0
    where id = v_onboarding.id;
    insert into public.onboarding_audit_events
      (onboarding_id, client_id, actor_id, event_type, changed_fields, note)
    values
      (v_onboarding.id, v_client.id, (select auth.uid()), 'changes_requested', v_changed_fields, trim(p_note));
    v_notification_type := 'onboarding_changes_requested';
    v_notification_title := 'Your profile needs an update';
    v_notification_body := trim(p_note);
  elsif p_action = 'approved' then
    update public.onboardings set
      sales_review_status = 'approved',
      sales_review_note = null,
      sales_reviewed_by = (select auth.uid()),
      sales_reviewed_at = now(),
      sales_reviewed_profile_version = v_new_version
    where id = v_onboarding.id;
    insert into public.onboarding_audit_events
      (onboarding_id, client_id, actor_id, event_type, changed_fields)
    values
      (v_onboarding.id, v_client.id, (select auth.uid()), 'approved', '{}');
    v_notification_type := 'onboarding_profile_approved';
    v_notification_title := 'Your BluBook profile has been approved';
    v_notification_body := 'Your core profile has been reviewed by BluBook Sales.';
  end if;

  if v_notification_type is not null and v_client.primary_profile_id is not null then
    insert into public.notifications (recipient_id, type, title, body, urgent)
    values (v_client.primary_profile_id, v_notification_type, v_notification_title, v_notification_body, false);
  end if;

  return v_new_version;
end;
$$;

revoke all on function public.review_onboarding_profile(uuid, text, integer, jsonb, text) from public;
grant execute on function public.review_onboarding_profile(uuid, text, integer, jsonb, text)
  to authenticated, service_role;
