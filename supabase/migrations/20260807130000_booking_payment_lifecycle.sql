-- Client Bookings editing and the narrow provider payment action.
-- Bookings remains a filtered view over sales_opportunities; no duplicate
-- booking rows or synchronization process is introduced.

create or replace function public.guard_sales_opportunity_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.client_id is distinct from old.client_id
     or new.deal_reference is distinct from old.deal_reference
     or new.currency is distinct from old.currency
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Opportunity identity fields are immutable';
  end if;
  if old.booked_at is not null and new.booked_at is null then
    raise exception 'The permanent booking timestamp cannot be cleared';
  end if;
  if new.payment_status = 'paid' and new.forecast_category <> 'closed' then
    raise exception 'Paid opportunities must remain Closed';
  end if;
  if new.opportunity_source is distinct from old.opportunity_source and not exists (
    select 1 from public.opportunity_sources where code = new.opportunity_source and active
  ) then
    raise exception 'Choose an active opportunity source';
  end if;
  if new.forecast_category is distinct from old.forecast_category and not exists (
    select 1 from public.forecast_categories where code = new.forecast_category and active
  ) then
    raise exception 'Choose an active forecast category';
  end if;
  new.opportunity_name := btrim(new.opportunity_name);
  if new.invoice_number is not null then new.invoice_number := btrim(new.invoice_number); end if;
  return new;
end;
$$;

create or replace function public.update_client_booking(
  p_opportunity_id uuid,
  p_expected_updated_at timestamptz,
  p_revenue numeric,
  p_fiscal_year smallint,
  p_fiscal_quarter smallint,
  p_fiscal_week smallint,
  p_payment_status public.opportunity_payment_status
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
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
      and request.request_type = 'purchase_order'
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
$$;

create or replace function public.set_linked_purchase_order_payment(
  p_request_id uuid,
  p_expected_updated_at timestamptz,
  p_payment_status public.opportunity_payment_status
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider_id uuid;
  v_request public.service_requests;
  v_opportunity public.sales_opportunities;
  v_updated_at timestamptz;
begin
  if public.current_user_type() is distinct from 'service_provider'::public.user_type then
    raise exception 'Only service providers may update linked purchase-order payment';
  end if;
  v_provider_id := public.current_provider_id();
  select * into v_request from public.service_requests
  where id = p_request_id for update;
  if not found
     or v_request.request_type <> 'purchase_order'
     or v_request.status <> 'completed'
     or v_request.sales_opportunity_id is null
     or v_request.provider_id is distinct from v_provider_id then
    raise exception 'Completed linked purchase order not found';
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
$$;

drop function public.get_linked_opportunity_for_request(uuid);

create function public.get_linked_opportunity_for_request(p_request_id uuid)
returns table (
  deal_reference text,
  opportunity_name text,
  revenue numeric,
  currency text,
  fiscal_year smallint,
  fiscal_quarter smallint,
  fiscal_week smallint,
  invoice_number text,
  payment_status public.opportunity_payment_status,
  booked_at timestamptz,
  paid_at timestamptz,
  updated_at timestamptz
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
    opportunity.payment_status,
    opportunity.booked_at,
    opportunity.paid_at,
    opportunity.updated_at
  from public.service_requests request
  join public.sales_opportunities opportunity on opportunity.id = request.sales_opportunity_id
  where request.id = p_request_id
    and (
      public.is_staff()
      or request.client_id = public.current_client_id()
      or request.provider_id = public.current_provider_id()
    );
$$;

revoke execute on function public.update_client_booking(uuid,timestamptz,numeric,smallint,smallint,smallint,public.opportunity_payment_status) from public;
revoke execute on function public.set_linked_purchase_order_payment(uuid,timestamptz,public.opportunity_payment_status) from public;
revoke execute on function public.get_linked_opportunity_for_request(uuid) from public;
grant execute on function public.update_client_booking(uuid,timestamptz,numeric,smallint,smallint,smallint,public.opportunity_payment_status) to authenticated, service_role;
grant execute on function public.set_linked_purchase_order_payment(uuid,timestamptz,public.opportunity_payment_status) to authenticated, service_role;
grant execute on function public.get_linked_opportunity_for_request(uuid) to authenticated, service_role;
