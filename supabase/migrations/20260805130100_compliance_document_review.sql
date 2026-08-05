-- Notify staff when a client supplies a document for an onboarding checklist.
create or replace function public.create_compliance_upload_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uploader_type public.user_type;
  v_business_name text;
  v_document_name text;
  v_request_id uuid;
begin
  if new.onboarding_document_id is null or new.uploaded_by is null then
    return new;
  end if;

  select p.user_type into v_uploader_type
  from public.profiles p
  where p.id = new.uploaded_by;

  if v_uploader_type is distinct from 'client' then
    return new;
  end if;

  select c.business_name, cdt.name, o.compliance_request_id
    into v_business_name, v_document_name, v_request_id
  from public.onboarding_documents od
  join public.onboardings o on o.id = od.onboarding_id
  join public.clients c on c.id = o.client_id
  join public.compliance_document_types cdt on cdt.id = od.document_type_id
  where od.id = new.onboarding_document_id;

  insert into public.notifications (recipient_id, type, title, body, request_id, document_id)
  select p.id,
         'compliance_review',
         'Compliance document received',
         v_business_name || ' submitted ' || v_document_name || ' for review.',
         v_request_id,
         new.id
  from public.profiles p
  where p.user_type = 'staff'
    and p.status = 'active';

  return new;
end;
$$;

create trigger documents_notify_compliance_upload
  after insert on public.documents
  for each row execute function public.create_compliance_upload_notifications();

-- Review a received document and tell the customer the outcome in the same
-- transaction. Only staff may call this function and rejection/acceptance
-- messages cannot be blank.
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

  select od.status, cdt.name, o.compliance_request_id, c.primary_profile_id
    into v_current_status, v_document_name, v_request_id, v_client_profile_id
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
  if v_request_id is null or v_client_profile_id is null then
    raise exception 'The customer compliance conversation is unavailable';
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

  insert into public.notifications (recipient_id, type, title, body, request_id)
  values (
    v_client_profile_id,
    'compliance_review',
    'Document ' || v_outcome || ': ' || v_document_name,
    trim(p_message),
    v_request_id
  );
end;
$$;

revoke execute on function public.review_onboarding_document(uuid, public.compliance_status, text) from public;
grant execute on function public.review_onboarding_document(uuid, public.compliance_status, text)
  to authenticated, service_role;
