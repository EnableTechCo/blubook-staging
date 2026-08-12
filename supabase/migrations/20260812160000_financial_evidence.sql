-- Financial submissions: premium only, and evidence required
--
-- Three changes, all tightening what was there.
--
-- 1. Only premium finance partners may submit. Filing a client's figures means
--    handling their accounts, which is the premium relationship; a standard
--    partner should not know the surface exists, so the gate that hides the
--    navigation is the same one that refuses the write.
--
-- 2. Every submission carries a supporting document. The figures are a claim;
--    the document is the evidence for it, and a claim with no evidence is not
--    worth storing.
--
-- 3. A document filed into someone's library can be read by them. Without this
--    the partner's copy of its own evidence would be a folder entry pointing
--    at a row it is not allowed to read.

-- ---------------------------------------------------------------------------
-- 1. Premium only
-- ---------------------------------------------------------------------------

create or replace function public.can_submit_client_financials(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.providers p
      join public.work_group_members wgm on wgm.provider_id = p.id
      join public.service_groups g on g.id = wgm.work_group_id
      join public.services s on s.group_id = g.id
      join public.line_items li on li.service_id = s.id
      join public.client_package_line_items cpli on cpli.source_line_item_id = li.id
      join public.client_packages cp on cp.id = cpli.client_package_id
      where p.id = public.current_provider_id()
        and p.tier = 'premium'
        and g.submits_financials
        and g.active
        and cp.client_id = p_client_id
        and cp.status = 'active'
    ),
    false
  );
$$;

comment on function public.can_submit_client_financials(uuid) is
  'True when the caller is a premium partner in a financial-responsibility work group covering this client.';

-- ---------------------------------------------------------------------------
-- 2. Evidence
-- ---------------------------------------------------------------------------
--
-- not null with no default and no backfill, because nothing has been submitted
-- yet. If figures had already been filed this would have to be nullable with a
-- separate cleanup, and the constraint would mean less.

alter table public.client_financials
  add column evidence_document_id uuid not null references public.documents (id) on delete restrict;

comment on column public.client_financials.evidence_document_id is
  'The supporting document filed with these figures. Restricted on delete: evidence cannot be removed while the figures it supports stand.';

create index client_financials_evidence_idx
  on public.client_financials (evidence_document_id);

-- The evidence argument changes the signature, so this is a new overload rather
-- than a replacement. The previous one has to go, or every call and grant
-- becomes ambiguous between the two.
drop function if exists public.submit_client_financials(
  uuid, smallint, smallint, smallint,
  numeric, numeric, numeric, numeric, numeric, numeric, numeric,
  numeric, numeric, numeric, numeric,
  integer, integer
);

create function public.submit_client_financials(
  p_client_id uuid,
  p_fiscal_year smallint,
  p_fiscal_quarter smallint,
  p_fiscal_week smallint,
  p_evidence_document_id uuid,
  p_net_income numeric default 0,
  p_non_cash_expenses numeric default 0,
  p_working_capital_change numeric default 0,
  p_earnings numeric default 0,
  p_taxes numeric default 0,
  p_depreciation numeric default 0,
  p_amortisation numeric default 0,
  p_current_assets numeric default 0,
  p_current_liabilities numeric default 0,
  p_total_liabilities numeric default 0,
  p_total_equity numeric default 0,
  p_lost_customers integer default 0,
  p_total_customers integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider uuid := public.current_provider_id();
  v_id uuid;
begin
  if not public.can_submit_client_financials(p_client_id) then
    raise exception 'You may not submit financial figures for this client';
  end if;

  -- The evidence must belong to the client the figures are about, so a
  -- document cannot be filed against one account and cited for another.
  if not exists (
    select 1 from public.documents d
    where d.id = p_evidence_document_id and d.client_id = p_client_id
  ) then
    raise exception 'The supporting document does not belong to this client';
  end if;

  insert into public.client_financials (
    client_id, fiscal_year, fiscal_quarter, fiscal_week, evidence_document_id,
    net_income, non_cash_expenses, working_capital_change,
    earnings, taxes, depreciation, amortisation,
    current_assets, current_liabilities, total_liabilities, total_equity,
    lost_customers, total_customers, submitted_by_provider_id
  )
  values (
    p_client_id, p_fiscal_year, p_fiscal_quarter, p_fiscal_week, p_evidence_document_id,
    p_net_income, p_non_cash_expenses, p_working_capital_change,
    p_earnings, p_taxes, p_depreciation, p_amortisation,
    p_current_assets, p_current_liabilities, p_total_liabilities, p_total_equity,
    p_lost_customers, p_total_customers, v_provider
  )
  on conflict (client_id, fiscal_year, fiscal_quarter, fiscal_week) do update set
    evidence_document_id = excluded.evidence_document_id,
    net_income = excluded.net_income,
    non_cash_expenses = excluded.non_cash_expenses,
    working_capital_change = excluded.working_capital_change,
    earnings = excluded.earnings,
    taxes = excluded.taxes,
    depreciation = excluded.depreciation,
    amortisation = excluded.amortisation,
    current_assets = excluded.current_assets,
    current_liabilities = excluded.current_liabilities,
    total_liabilities = excluded.total_liabilities,
    total_equity = excluded.total_equity,
    lost_customers = excluded.lost_customers,
    total_customers = excluded.total_customers,
    submitted_by_provider_id = excluded.submitted_by_provider_id
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_client_financials from public;
grant execute on function public.submit_client_financials to authenticated;

-- ---------------------------------------------------------------------------
-- 3. A filing grants read access
-- ---------------------------------------------------------------------------
--
-- Adds one arm to the existing policy: you may read a document that sits in
-- your own library. document_filings is already scoped to its owner, so this
-- cannot reach a filing belonging to somebody else.

drop policy if exists documents_select on public.documents;

create policy documents_select on public.documents
  for select to authenticated
  using (
    public.is_staff()
    or client_id = public.current_client_id()
    or id in (
      select rd.document_id
      from public.request_documents rd
      join public.service_requests sr on sr.id = rd.request_id
      where sr.provider_id = public.current_provider_id()
    )
    or id in (
      select f.document_id
      from public.document_filings f
      where f.owner_profile_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- The list layer
-- ---------------------------------------------------------------------------
--
-- Every client the partner is responsible for, with whether a given week has
-- been filed. A function rather than a view because the week is an argument:
-- the fiscal calendar lives in the application, and passing the period in keeps
-- one definition of it rather than a second written in SQL.

create or replace function public.financial_submission_overview(
  p_fiscal_year smallint,
  p_fiscal_quarter smallint,
  p_fiscal_week smallint
)
returns table (
  client_id uuid,
  external_reference text,
  business_name text,
  submitted_at timestamptz,
  evidence_document_id uuid,
  evidence_title text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.external_reference,
    case when public.can_see_client_identity(c.id) then c.business_name end,
    f.updated_at,
    f.evidence_document_id,
    d.title
  from public.clients c
  left join public.client_financials f
    on f.client_id = c.id
   and f.fiscal_year = p_fiscal_year
   and f.fiscal_quarter = p_fiscal_quarter
   and f.fiscal_week = p_fiscal_week
  left join public.documents d on d.id = f.evidence_document_id
  where public.can_submit_client_financials(c.id)
  order by c.external_reference;
$$;

comment on function public.financial_submission_overview(smallint, smallint, smallint) is
  'Clients the calling premium finance partner is responsible for, with whether the given week has been filed.';

revoke all on function public.financial_submission_overview from public;
grant execute on function public.financial_submission_overview to authenticated;
