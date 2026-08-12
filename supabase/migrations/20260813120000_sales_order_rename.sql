-- Rename the purchase order to what it actually is: a sales order
--
-- The existing flow links to a pipeline opportunity, is completed by a partner
-- returning an invoice, and lands in Bookings as revenue. That is a sales
-- order — the client selling to their own customer. It was named purchase
-- order throughout, which meant the codebase said "money coming in" and
-- "money going out" with the same word.
--
-- Renaming rather than relabelling: the enum value, three functions, an index
-- and a service slug all carried the wrong name. Leaving them would have been
-- worse than never naming them, because the real purchase order added below
-- would then be a second, different thing also called purchase_order.
--
-- The rename preserves every existing row. `alter type ... rename value` keeps
-- the seven service requests already recorded, which a new value plus a data
-- migration would not have done as cleanly.

alter type public.request_type rename value 'purchase_order' to 'sales_order';

-- The real purchase order: the client buying. Adding the label here is safe
-- because nothing in this migration writes it — Postgres only forbids using a
-- new enum label in the transaction that adds it.
alter type public.request_type add value if not exists 'purchase_order';

-- ---------------------------------------------------------------------------
-- Names
-- ---------------------------------------------------------------------------
--
-- Renamed rather than dropped and recreated, so grants and dependencies come
-- with them. The bodies are replaced below, because they compare against the
-- enum label that just changed and would otherwise fail at runtime with an
-- invalid enum value.

alter function public.submit_linked_purchase_order(uuid, jsonb, uuid, text, text, jsonb, uuid)
  rename to submit_linked_sales_order;
alter function public.complete_purchase_order_with_invoice(uuid, text, jsonb)
  rename to complete_sales_order_with_invoice;
alter function public.set_linked_purchase_order_payment(uuid, timestamptz, public.opportunity_payment_status)
  rename to set_linked_sales_order_payment;

alter index public.service_requests_purchase_order_opportunity_unique
  rename to service_requests_sales_order_opportunity_unique;

-- ---------------------------------------------------------------------------
-- Bodies
-- ---------------------------------------------------------------------------
--
-- Transcribed from the live definitions with only the enum label and the names
-- changed, so the routing and guard logic is exactly what it was.

create or replace function public.guard_request_business_links()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_opportunity_client uuid;
  v_source_client uuid;
begin
  if new.request_type = 'sales_order'
     and new.sales_opportunity_id is null
     and (tg_op = 'INSERT' or old.request_type is distinct from 'sales_order') then
    raise exception 'A sales order must be linked to a pipeline opportunity';
  end if;
  if new.request_type <> 'sales_order' and new.sales_opportunity_id is not null then
    raise exception 'Only sales orders may link directly to an opportunity';
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
$function$
;

create or replace function public.update_client_booking(p_opportunity_id uuid, p_expected_updated_at timestamp with time zone, p_revenue numeric, p_fiscal_year smallint, p_fiscal_quarter smallint, p_fiscal_week smallint, p_payment_status opportunity_payment_status)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_client_id uuid;
  v_opportunity public.sales_opportunities;
  v_updated_at timestamptz;
begin
  if public.current_user_type() is distinct from 'client'::public.user_type then
    raise exception 'Only client users may edit bookings';
  end if;
  v_client_id := public.current_client_id();
  select * into v_opportunity
  from public.sales_opportunities
  where id = p_opportunity_id and client_id = v_client_id
  for update;
  if not found or v_opportunity.booked_at is null or not exists (
    select 1 from public.service_requests request
    where request.sales_opportunity_id = v_opportunity.id
      and request.request_type = 'sales_order'
      and request.status = 'completed'
  ) then
    raise exception 'Booking not found';
  end if;
  if v_opportunity.updated_at is distinct from p_expected_updated_at then
    raise exception 'This booking was updated by someone else. Refresh and try again';
  end if;
  if p_revenue is null then raise exception 'Revenue is required'; end if;
  if p_payment_status is null then raise exception 'Payment status is required'; end if;
  if p_revenue < 0 then raise exception 'Revenue cannot be negative'; end if;
  if (p_fiscal_year is null and (p_fiscal_quarter is not null or p_fiscal_week is not null))
     or (p_fiscal_quarter is null and p_fiscal_week is not null) then
    raise exception 'Choose fiscal year before quarter, and quarter before week';
  end if;

  update public.sales_opportunities set
    revenue = p_revenue,
    fiscal_year = p_fiscal_year,
    fiscal_quarter = p_fiscal_quarter,
    fiscal_week = p_fiscal_week,
    payment_status = p_payment_status,
    paid_at = case
      when p_payment_status = 'paid' then coalesce(paid_at, now())
      else null
    end,
    forecast_category = case
      when p_payment_status = 'paid' then 'closed'
      else forecast_category
    end
  where id = v_opportunity.id
  returning updated_at into v_updated_at;

  return v_updated_at;
end;
$function$
;

create or replace function public.submit_linked_sales_order(p_opportunity_id uuid, p_new_opportunity jsonb, p_service_id uuid, p_title text, p_description text, p_documents jsonb, p_category_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(request_id uuid, request_reference text, opportunity_id uuid, deal_reference text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_client_id uuid;
  v_profile_id uuid := (select auth.uid());
  v_opportunity public.sales_opportunities;
  v_request public.service_requests;
  v_document jsonb;
  v_document_id uuid;
begin
  if public.current_user_type() is distinct from 'client'::public.user_type then
    raise exception 'Only client users may submit sales orders';
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
    if v_opportunity.booked_at is not null then raise exception 'Booked opportunities cannot receive another sales order'; end if;
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
    'sales_order', v_opportunity.id
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
$function$
;

create or replace function public.complete_sales_order_with_invoice(p_request_id uuid, p_invoice_number text, p_document jsonb)
 RETURNS TABLE(delivery_request_id uuid, delivery_reference text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_provider_id uuid;
  v_request public.service_requests;
  v_opportunity public.sales_opportunities;
  v_document_id uuid;
  v_delivery public.service_requests;
begin
  if public.current_user_type() is distinct from 'service_provider'::public.user_type then
    raise exception 'Only service providers may complete sales orders';
  end if;
  v_provider_id := public.current_provider_id();
  select * into v_request from public.service_requests
  where id = p_request_id for update;
  if not found or v_request.request_type <> 'sales_order'
     or v_request.sales_opportunity_id is null
     or v_request.provider_id is distinct from v_provider_id then
    raise exception 'Linked sales order not found';
  end if;
  if v_request.status not in ('assigned', 'in_progress') then
    raise exception 'This sales order cannot be completed from its current status';
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
$function$
;

create or replace function public.set_linked_sales_order_payment(p_request_id uuid, p_expected_updated_at timestamp with time zone, p_payment_status opportunity_payment_status)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_provider_id uuid;
  v_request public.service_requests;
  v_opportunity public.sales_opportunities;
  v_updated_at timestamptz;
begin
  if public.current_user_type() is distinct from 'service_provider'::public.user_type then
    raise exception 'Only service providers may update linked sales-order payment';
  end if;
  v_provider_id := public.current_provider_id();
  select * into v_request from public.service_requests
  where id = p_request_id for update;
  if not found
     or v_request.request_type <> 'sales_order'
     or v_request.status <> 'completed'
     or v_request.sales_opportunity_id is null
     or v_request.provider_id is distinct from v_provider_id then
    raise exception 'Completed linked sales order not found';
  end if;

  select * into v_opportunity from public.sales_opportunities
  where id = v_request.sales_opportunity_id for update;
  if not found or v_opportunity.updated_at is distinct from p_expected_updated_at then
    raise exception 'This booking was updated by someone else. Refresh and try again';
  end if;
  if p_payment_status is null then raise exception 'Payment status is required'; end if;

  update public.sales_opportunities set
    payment_status = p_payment_status,
    paid_at = case
      when p_payment_status = 'paid' then coalesce(paid_at, now())
      else null
    end,
    forecast_category = case
      when p_payment_status = 'paid' then 'closed'
      else forecast_category
    end
  where id = v_opportunity.id
  returning updated_at into v_updated_at;
  return v_updated_at;
end;
$function$
;


-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------

update public.services
set slug = 'sales-order-submission',
    name = 'Sales Order',
    description = 'A sales order raised against a pipeline opportunity, completed by a partner returning an invoice.'
where slug = 'purchase-order-submission';

-- The new one. A purchase order is the client committing to spend, so it is a
-- straightforward routed submission: no opportunity, no invoice return, no
-- booking. Putting outgoing spend into the revenue pipeline would make the
-- sales dashboard count money the business is paying out.
insert into public.services (slug, name, description, active, group_id)
select
  'purchase-order-submission',
  'Purchase Order',
  'A purchase order the business is placing, with its supporting documents, for the Sales Operations desk to process.',
  true,
  (select id from public.service_groups where slug = 'sales-operations')
on conflict (slug) do nothing;
