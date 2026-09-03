-- A partner's completed sales-order invoice is a client record, not merely a
-- request attachment. Give it a predictable home in every client archive and
-- file it there in the same transaction that completes the order.

-- Existing client archives already have Sales Articles, so add the missing
-- child folder without changing any of their current folders or names.
insert into public.document_categories (owner_profile_id, parent_id, slug, name, sort_order)
select sales.owner_profile_id, sales.id, 'invoices', 'Invoices', 18
from public.document_categories sales
where sales.slug = 'sales'
  and not exists (
    select 1
    from public.document_categories existing
    where existing.owner_profile_id = sales.owner_profile_id
      and existing.slug = 'invoices'
  );

-- Future client and provider archives receive the same complete Sales Articles
-- tree. Existing owners are deliberately not reseeded: the insert above is the
-- non-destructive backfill for their customised folder trees.
create or replace function public.seed_default_folders(p_owner uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_parent uuid;
begin
  if exists (select 1 from public.document_categories where owner_profile_id = p_owner) then
    return;
  end if;

  insert into public.document_categories (owner_profile_id, slug, name, sort_order) values
    (p_owner, 'sales', 'Sales Articles', 10),
    (p_owner, 'human-resources', 'Human Resources Articles', 20),
    (p_owner, 'warehouse-logistics', 'Warehouse and Logistics', 30),
    (p_owner, 'finance', 'Finance', 40),
    (p_owner, 'legal', 'Legal', 50);

  select id into v_parent from public.document_categories
    where owner_profile_id = p_owner and slug = 'sales';
  insert into public.document_categories (owner_profile_id, parent_id, slug, name, sort_order) values
    (p_owner, v_parent, 'purchase-orders', 'Purchase Orders', 10),
    (p_owner, v_parent, 'quotations', 'Quotations', 15),
    (p_owner, v_parent, 'invoices', 'Invoices', 18),
    (p_owner, v_parent, 'receipts', 'Receipts', 20),
    (p_owner, v_parent, 'proof-of-delivery', 'POD' || chr(39) || 's', 30);

  select id into v_parent from public.document_categories
    where owner_profile_id = p_owner and slug = 'human-resources';
  insert into public.document_categories (owner_profile_id, parent_id, slug, name, sort_order) values
    (p_owner, v_parent, 'employment-contracts', 'Employment contracts', 10),
    (p_owner, v_parent, 'hr-policies', 'Essential HR Policies', 20);
end;
$fn$;

create or replace function public.complete_sales_order_with_invoice(
  p_request_id uuid,
  p_invoice_number text,
  p_document jsonb
)
returns table(delivery_request_id uuid, delivery_reference text)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_provider_id uuid;
  v_request public.service_requests;
  v_opportunity public.sales_opportunities;
  v_document_id uuid;
  v_delivery public.service_requests;
  v_client_profile_id uuid;
  v_invoice_folder_id uuid;
begin
  if public.current_user_type() is distinct from 'service_provider'::public.user_type then
    raise exception 'Only service providers may complete sales orders';
  end if;

  v_provider_id := public.current_provider_id();
  select * into v_request
  from public.service_requests
  where id = p_request_id
  for update;

  if not found
     or v_request.request_type <> 'sales_order'
     or v_request.sales_opportunity_id is null
     or v_request.provider_id is distinct from v_provider_id then
    raise exception 'Linked sales order not found';
  end if;

  if v_request.status not in ('assigned', 'in_progress') then
    raise exception 'This sales order cannot be completed from its current status';
  end if;

  if nullif(btrim(p_invoice_number), '') is null then
    raise exception 'Enter an invoice number';
  end if;

  if nullif(p_document->>'locator', '') is null
     or nullif(p_document->>'title', '') is null
     or (p_document->>'sizeBytes')::bigint <= 0
     or position('supabase://documents/' || v_request.client_id::text || '/' in (p_document->>'locator')) <> 1
     or not exists (
       select 1
       from storage.objects
       where bucket_id = 'documents'
         and name = replace(p_document->>'locator', 'supabase://documents/', '')
     ) then
    raise exception 'Invalid invoice document metadata';
  end if;

  select * into v_opportunity
  from public.sales_opportunities
  where id = v_request.sales_opportunity_id
  for update;

  if not found then
    raise exception 'Linked opportunity not found';
  end if;

  insert into public.documents (
    client_id, uploaded_by, category, title, storage_path, mime_type, size_bytes
  ) values (
    v_request.client_id,
    (select auth.uid()),
    'generated',
    p_document->>'title',
    p_document->>'locator',
    p_document->>'mimeType',
    (p_document->>'sizeBytes')::bigint
  )
  returning id into v_document_id;

  insert into public.request_documents (request_id, document_id)
  values (v_request.id, v_document_id);

  select primary_profile_id into v_client_profile_id
  from public.clients
  where id = v_request.client_id;

  if v_client_profile_id is null then
    raise exception 'Client document archive is unavailable';
  end if;

  select id into v_invoice_folder_id
  from public.document_categories
  where owner_profile_id = v_client_profile_id
    and slug = 'invoices';

  if v_invoice_folder_id is null then
    raise exception 'Client invoice archive folder is unavailable';
  end if;

  insert into public.document_filings (document_id, owner_profile_id, category_id)
  values (v_document_id, v_client_profile_id, v_invoice_folder_id);

  insert into public.service_requests (
    reference, origin, client_id, service_id, title, description,
    request_type, source_request_id, status
  ) values (
    '',
    'system',
    v_request.client_id,
    v_request.service_id,
    'Invoice ' || btrim(p_invoice_number),
    'Invoice returned for ' || v_request.reference || ' and ' || v_opportunity.deal_reference || '.',
    'document_delivery',
    v_request.id,
    'new'
  )
  returning * into v_delivery;

  insert into public.request_documents (request_id, document_id)
  values (v_delivery.id, v_document_id);

  update public.sales_opportunities
  set invoice_number = btrim(p_invoice_number),
      forecast_category = 'booked',
      booked_at = coalesce(booked_at, now()),
      payment_status = coalesce(payment_status, 'unpaid')
  where id = v_opportunity.id;

  update public.service_requests
  set status = 'completed'
  where id = v_request.id;

  return query select v_delivery.id, v_delivery.reference;
end;
$function$;
