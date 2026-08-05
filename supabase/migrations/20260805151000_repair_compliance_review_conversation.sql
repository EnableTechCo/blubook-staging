-- Legacy onboardings predate onboardings.compliance_request_id. Create the
-- private checklist conversation lazily when staff first reviews one of their
-- documents, rather than exposing a bulk set of new conversations to clients.

create or replace function public.ensure_onboarding_compliance_request(p_onboarding_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
  v_client_id uuid;
  v_staff_id uuid;
  v_business_name text;
  v_service_id uuid;
  v_checklist text;
begin
  select o.compliance_request_id,
         o.client_id,
         coalesce((select auth.uid()), o.sales_rep_id),
         c.business_name
    into v_request_id, v_client_id, v_staff_id, v_business_name
  from public.onboardings o
  join public.clients c on c.id = o.client_id
  where o.id = p_onboarding_id
  for update of o;

  if not found then
    raise exception 'Onboarding not found';
  end if;
  if v_request_id is not null
     and exists (select 1 from public.service_requests where id = v_request_id) then
    return v_request_id;
  end if;

  select id into v_service_id
  from public.services
  where slug = 'blubook-onboarding-check';
  if v_service_id is null then
    raise exception 'The onboarding check service is missing from the catalogue';
  end if;

  insert into public.service_requests (
    reference, origin, client_id, created_by, service_id, title, description
  )
  values (
    '',
    'system',
    v_client_id,
    v_staff_id,
    v_service_id,
    'Documents required for account setup',
    'Upload the compliance documents required to complete your account setup.'
  )
  returning id into v_request_id;

  update public.onboardings
  set compliance_request_id = v_request_id
  where id = p_onboarding_id;

  select string_agg('- ' || cdt.name, E'\n' order by cdt.name)
    into v_checklist
  from public.onboarding_documents od
  join public.compliance_document_types cdt on cdt.id = od.document_type_id
  where od.onboarding_id = p_onboarding_id;

  insert into public.request_messages (request_id, sender_id, sender_role, body)
  values (
    v_request_id,
    v_staff_id,
    'staff',
    'This conversation contains the compliance checklist for ' || v_business_name || '.' ||
    case when v_checklist is null then '' else E'\n\n' || v_checklist end ||
    E'\n\nBluBook staff will record each document review here.'
  );

  return v_request_id;
end;
$$;

revoke execute on function public.ensure_onboarding_compliance_request(uuid) from public, anon, authenticated;
grant execute on function public.ensure_onboarding_compliance_request(uuid) to service_role;

create or replace function public.review_onboarding_document(
  p_document_id uuid,
  p_decision public.compliance_status,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_onboarding_id uuid;
  v_current_status public.compliance_status;
  v_document_name text;
  v_request_id uuid;
  v_client_profile_id uuid;
  v_outcome text;
  v_message_body text;
begin
  if not public.is_staff() then
    raise exception 'Not authorized to review compliance documents';
  end if;
  if p_decision not in ('verified', 'rejected') then
    raise exception 'Decision must be verified or rejected';
  end if;
  if nullif(trim(p_message), '') is null then
    raise exception 'A message to the customer is required';
  end if;

  select o.id, od.status, cdt.name, o.compliance_request_id, c.primary_profile_id
    into v_onboarding_id, v_current_status, v_document_name, v_request_id, v_client_profile_id
  from public.onboarding_documents od
  join public.compliance_document_types cdt on cdt.id = od.document_type_id
  join public.onboardings o on o.id = od.onboarding_id
  join public.clients c on c.id = o.client_id
  where od.id = p_document_id;

  if not found then
    raise exception 'Compliance document not found';
  end if;
  if v_current_status <> 'received' then
    raise exception 'Only received documents can be reviewed';
  end if;
  if v_request_id is null then
    v_request_id := public.ensure_onboarding_compliance_request(v_onboarding_id);
  end if;

  v_outcome := case when p_decision = 'verified' then 'accepted' else 'rejected' end;
  v_message_body := case
    when p_decision = 'verified' then
      'Your ' || v_document_name || ' has been accepted.' || E'\n\n' || trim(p_message)
    else
      'Your ' || v_document_name || ' was rejected and needs a replacement.' ||
      E'\n\nReason:\n' || trim(p_message) ||
      E'\n\nReturn to this conversation to upload a replacement.'
  end;

  update public.onboarding_documents
  set status = p_decision,
      notes = trim(p_message)
  where id = p_document_id;

  insert into public.request_messages (request_id, sender_id, sender_role, body)
  values (v_request_id, (select auth.uid()), 'staff', v_message_body);

  -- A broken/missing primary-profile link must not prevent staff from recording
  -- a review. The conversation retains the outcome; notification is added when
  -- there is a valid recipient.
  if v_client_profile_id is not null then
    insert into public.notifications (recipient_id, type, title, body, request_id)
    values (
      v_client_profile_id,
      'compliance_review',
      'Document ' || v_outcome || ': ' || v_document_name,
      trim(p_message),
      v_request_id
    );
  end if;
end;
$$;

revoke execute on function public.review_onboarding_document(uuid, public.compliance_status, text) from public;
grant execute on function public.review_onboarding_document(uuid, public.compliance_status, text)
  to authenticated, service_role;
