-- Link every newly submitted purchase order to one client-owned sales
-- opportunity and provide narrow, atomic functions for submission and partner
-- invoice completion. Existing historic purchase orders remain readable.

alter table public.service_requests
  add column sales_opportunity_id uuid
    references public.sales_opportunities (id) on delete restrict,
  add column source_request_id uuid
    references public.service_requests (id) on delete restrict;

create unique index service_requests_purchase_order_opportunity_unique
  on public.service_requests (sales_opportunity_id)
  where request_type = 'purchase_order' and sales_opportunity_id is not null;

create index service_requests_source_request_id_idx
  on public.service_requests (source_request_id)
  where source_request_id is not null;

create or replace function public.guard_request_business_links()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_opportunity_client uuid;
  v_source_client uuid;
begin
  if new.request_type = 'purchase_order'
     and new.sales_opportunity_id is null
     and (tg_op = 'INSERT' or old.request_type is distinct from 'purchase_order') then
    raise exception 'A purchase order must be linked to a pipeline opportunity';
  end if;
  if new.request_type <> 'purchase_order' and new.sales_opportunity_id is not null then
    raise exception 'Only purchase orders may link directly to an opportunity';
  end if;
  if new.source_request_id is not null and new.request_type <> 'document_delivery' then
    raise exception 'Only a document delivery may reference a source request';
  end if;

  if new.sales_opportunity_id is not null then
    select client_id into v_opportunity_client
    from public.sales_opportunities where id = new.sales_opportunity_id;
    if not found or v_opportunity_client is distinct from new.client_id then
      raise exception 'The opportunity does not belong to this client';
    end if;
  end if;

  if new.source_request_id is not null then
    select client_id into v_source_client
    from public.service_requests where id = new.source_request_id;
    if not found or v_source_client is distinct from new.client_id then
      raise exception 'The source request does not belong to this client';
    end if;
  end if;

  if tg_op = 'UPDATE' and (
    new.sales_opportunity_id is distinct from old.sales_opportunity_id
    or new.source_request_id is distinct from old.source_request_id
  ) then
    raise exception 'Request business links are immutable';
  end if;
  return new;
end;
$$;

create trigger service_requests_guard_business_links
  before insert or update on public.service_requests
  for each row execute function public.guard_request_business_links();

create or replace function public.submit_linked_purchase_order(
  p_opportunity_id uuid,
  p_new_opportunity jsonb,
  p_service_id uuid,
  p_title text,
  p_description text,
  p_documents jsonb,
  p_category_id uuid default null
)
returns table (request_id uuid, request_reference text, opportunity_id uuid, deal_reference text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client_id uuid;
  v_profile_id uuid := (select auth.uid());
  v_opportunity public.sales_opportunities;
  v_request public.service_requests;
  v_document jsonb;
  v_document_id uuid;
begin
  if public.current_user_type() is distinct from 'client'::public.user_type then
    raise exception 'Only client users may submit purchase orders';
  end if;
  v_client_id := public.current_client_id();
  if v_client_id is null then raise exception 'No client account is linked to this profile'; end if;
  if (p_opportunity_id is null) = (p_new_opportunity is null) then
    raise exception 'Choose one existing opportunity or create one new opportunity';
  end if;
  if jsonb_typeof(p_documents) <> 'array' or jsonb_array_length(p_documents) < 1
     or jsonb_array_length(p_documents) > 5 then
    raise exception 'Attach between 1 and 5 documents';
  end if;

  if p_opportunity_id is not null then
    select * into v_opportunity from public.sales_opportunities
    where id = p_opportunity_id and client_id = v_client_id for update;
    if not found then raise exception 'Opportunity not found'; end if;
    if v_opportunity.booked_at is not null then raise exception 'Booked opportunities cannot receive another purchase order'; end if;
  else
    insert into public.sales_opportunities (
      client_id, opportunity_source, opportunity_name, forecast_category,
      revenue, currency, fiscal_year, fiscal_quarter, fiscal_week
    ) values (
      v_client_id,
      p_new_opportunity->>'opportunitySource',
      p_new_opportunity->>'opportunityName',
      coalesce(p_new_opportunity->>'forecastCategory', 'open'),
      (p_new_opportunity->>'revenue')::numeric,
      'ZAR',
      nullif(p_new_opportunity->>'fiscalYear', '')::smallint,
      nullif(p_new_opportunity->>'fiscalQuarter', '')::smallint,
      nullif(p_new_opportunity->>'fiscalWeek', '')::smallint
    ) returning * into v_opportunity;
  end if;

  insert into public.service_requests (
    reference, origin, client_id, service_id, title, description,
    request_type, sales_opportunity_id
  ) values (
    '', 'client', v_client_id, p_service_id, btrim(p_title), p_description,
    'purchase_order', v_opportunity.id
  ) returning * into v_request;

  for v_document in select value from jsonb_array_elements(p_documents)
  loop
    if nullif(v_document->>'locator', '') is null
       or nullif(v_document->>'title', '') is null
       or (v_document->>'sizeBytes')::bigint <= 0
       or position('supabase://documents/' || v_client_id::text || '/' in (v_document->>'locator')) <> 1
       or not exists (
         select 1 from storage.objects
         where bucket_id = 'documents'
           and name = replace(v_document->>'locator', 'supabase://documents/', '')
       ) then
      raise exception 'Invalid document metadata';
    end if;
    insert into public.documents (
      client_id, uploaded_by, category, title, storage_path, mime_type, size_bytes
    ) values (
      v_client_id, v_profile_id, 'other', v_document->>'title',
      v_document->>'locator', v_document->>'mimeType', (v_document->>'sizeBytes')::bigint
    ) returning id into v_document_id;
    insert into public.request_documents (request_id, document_id)
      values (v_request.id, v_document_id);
    if p_category_id is not null then
      insert into public.document_filings (document_id, owner_profile_id, category_id)
        values (v_document_id, v_profile_id, p_category_id);
    end if;
  end loop;

  return query select v_request.id, v_request.reference, v_opportunity.id, v_opportunity.deal_reference;
end;
$$;

create or replace function public.complete_purchase_order_with_invoice(
  p_request_id uuid,
  p_invoice_number text,
  p_document jsonb
)
returns table (delivery_request_id uuid, delivery_reference text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider_id uuid;
  v_request public.service_requests;
  v_opportunity public.sales_opportunities;
  v_document_id uuid;
  v_delivery public.service_requests;
begin
  if public.current_user_type() is distinct from 'service_provider'::public.user_type then
    raise exception 'Only service providers may complete purchase orders';
  end if;
  v_provider_id := public.current_provider_id();
  select * into v_request from public.service_requests
  where id = p_request_id for update;
  if not found or v_request.request_type <> 'purchase_order'
     or v_request.sales_opportunity_id is null
     or v_request.provider_id is distinct from v_provider_id then
    raise exception 'Linked purchase order not found';
  end if;
  if v_request.status not in ('assigned', 'in_progress') then
    raise exception 'This purchase order cannot be completed from its current status';
  end if;
  if nullif(btrim(p_invoice_number), '') is null then raise exception 'Enter an invoice number'; end if;
  if nullif(p_document->>'locator', '') is null
     or nullif(p_document->>'title', '') is null
     or (p_document->>'sizeBytes')::bigint <= 0
     or position('supabase://documents/' || v_request.client_id::text || '/' in (p_document->>'locator')) <> 1
     or not exists (
       select 1 from storage.objects
       where bucket_id = 'documents'
         and name = replace(p_document->>'locator', 'supabase://documents/', '')
     ) then
    raise exception 'Invalid invoice document metadata';
  end if;

  select * into v_opportunity from public.sales_opportunities
  where id = v_request.sales_opportunity_id for update;
  if not found then raise exception 'Linked opportunity not found'; end if;

  insert into public.documents (
    client_id, uploaded_by, category, title, storage_path, mime_type, size_bytes
  ) values (
    v_request.client_id, (select auth.uid()), 'generated', p_document->>'title',
    p_document->>'locator', p_document->>'mimeType', (p_document->>'sizeBytes')::bigint
  ) returning id into v_document_id;

  insert into public.request_documents (request_id, document_id)
    values (v_request.id, v_document_id);

  insert into public.service_requests (
    reference, origin, client_id, service_id, title, description,
    request_type, source_request_id, status
  ) values (
    '', 'system', v_request.client_id, v_request.service_id,
    'Invoice ' || btrim(p_invoice_number),
    'Invoice returned for ' || v_request.reference || ' and ' || v_opportunity.deal_reference || '.',
    'document_delivery', v_request.id, 'new'
  ) returning * into v_delivery;

  insert into public.request_documents (request_id, document_id)
    values (v_delivery.id, v_document_id);

  update public.sales_opportunities set
    invoice_number = btrim(p_invoice_number),
    forecast_category = 'booked',
    booked_at = coalesce(booked_at, now()),
    payment_status = coalesce(payment_status, 'unpaid')
  where id = v_opportunity.id;

  update public.service_requests set status = 'completed'
  where id = v_request.id;

  return query select v_delivery.id, v_delivery.reference;
end;
$$;

create or replace function public.get_linked_opportunity_for_request(p_request_id uuid)
returns table (
  deal_reference text,
  opportunity_name text,
  revenue numeric,
  currency text,
  fiscal_year smallint,
  fiscal_quarter smallint,
  fiscal_week smallint,
  invoice_number text,
  booked_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    opportunity.deal_reference,
    opportunity.opportunity_name,
    opportunity.revenue,
    opportunity.currency,
    opportunity.fiscal_year,
    opportunity.fiscal_quarter,
    opportunity.fiscal_week,
    opportunity.invoice_number,
    opportunity.booked_at
  from public.service_requests request
  join public.sales_opportunities opportunity on opportunity.id = request.sales_opportunity_id
  where request.id = p_request_id
    and (
      public.is_staff()
      or request.client_id = public.current_client_id()
      or request.provider_id = public.current_provider_id()
    );
$$;

revoke execute on function public.guard_request_business_links() from public;
revoke execute on function public.submit_linked_purchase_order(uuid,jsonb,uuid,text,text,jsonb,uuid) from public;
revoke execute on function public.complete_purchase_order_with_invoice(uuid,text,jsonb) from public;
revoke execute on function public.get_linked_opportunity_for_request(uuid) from public;
grant execute on function public.submit_linked_purchase_order(uuid,jsonb,uuid,text,text,jsonb,uuid) to authenticated;
grant execute on function public.complete_purchase_order_with_invoice(uuid,text,jsonb) to authenticated;
grant execute on function public.get_linked_opportunity_for_request(uuid) to authenticated;
grant execute on function public.submit_linked_purchase_order(uuid,jsonb,uuid,text,text,jsonb,uuid) to service_role;
grant execute on function public.complete_purchase_order_with_invoice(uuid,text,jsonb) to service_role;
grant execute on function public.get_linked_opportunity_for_request(uuid) to service_role;
