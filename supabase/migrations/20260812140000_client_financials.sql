-- Client financial submissions
--
-- The Finance Dashboard's six ratios need raw figures that BluBook cannot
-- derive from anything it already holds: net income, taxes, depreciation,
-- assets, liabilities, equity, customer counts. Those come from the client's
-- finance partner, who submits them here.
--
-- What is stored is only the raw inputs. Every ratio on the dashboard —
-- operating cash flow, EBITDA, working capital, debt-to-equity, current ratio,
-- churn — is computed from these at read time, so a change to a formula never
-- requires a backfill and can never disagree with the numbers it was derived
-- from.
--
-- Figures are weekly, because the brief's dashboard reads "Week 11" against
-- them. Quarter-to-date figures are sums over the weeks of a quarter rather
-- than a second stored period, so the two can never drift.

create table public.client_financials (
  id                          uuid primary key default gen_random_uuid(),
  client_id                   uuid not null references public.clients (id) on delete cascade,
  fiscal_year                 smallint not null check (fiscal_year between 2000 and 2200),
  fiscal_quarter              smallint not null check (fiscal_quarter between 1 and 4),
  fiscal_week                 smallint not null check (fiscal_week between 1 and 13),

  -- Operating cash flow = net income + non-cash expenses + change in working capital
  net_income                  numeric(16, 2) not null default 0,
  non_cash_expenses           numeric(16, 2) not null default 0,
  working_capital_change      numeric(16, 2) not null default 0,

  -- EBITDA = earnings + taxes + depreciation + amortisation
  earnings                    numeric(16, 2) not null default 0,
  taxes                       numeric(16, 2) not null default 0,
  depreciation                numeric(16, 2) not null default 0,
  amortisation                numeric(16, 2) not null default 0,

  -- Working capital, current ratio, debt-to-equity
  current_assets              numeric(16, 2) not null default 0 check (current_assets >= 0),
  current_liabilities         numeric(16, 2) not null default 0 check (current_liabilities >= 0),
  total_liabilities           numeric(16, 2) not null default 0 check (total_liabilities >= 0),
  total_equity                numeric(16, 2) not null default 0,

  -- Churn = lost customers / total customers. The client's own customers, not
  -- BluBook's: this is a measure of the client's business, not of the platform.
  lost_customers              integer not null default 0 check (lost_customers >= 0),
  total_customers             integer not null default 0 check (total_customers >= 0),

  currency                    text not null default 'ZAR' check (currency = 'ZAR'),
  -- The provider that supplied the figures. Kept for staff and for the client,
  -- never surfaced to another partner.
  submitted_by_provider_id    uuid references public.providers (id) on delete set null,
  submitted_by                uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint client_financials_lost_within_total check (lost_customers <= total_customers),
  -- One submission per week. Re-submitting a week corrects it rather than
  -- adding a second set of figures that would double every sum.
  constraint client_financials_unique_week unique (client_id, fiscal_year, fiscal_quarter, fiscal_week)
);

comment on table public.client_financials is
  'Weekly raw financial inputs supplied by a client''s finance partner. Ratios are computed from these at read time, never stored.';

create index client_financials_client_period_idx
  on public.client_financials (client_id, fiscal_year, fiscal_quarter, fiscal_week);

create trigger client_financials_set_updated_at
  before update on public.client_financials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Which work group carries the responsibility
-- ---------------------------------------------------------------------------
--
-- A flag rather than a hardcoded 'finance' slug, so staff can move the
-- responsibility without a migration, and so a second group could share it.

alter table public.service_groups
  add column if not exists submits_financials boolean not null default false;

comment on column public.service_groups.submits_financials is
  'Partners in this group may submit financial figures for the clients it covers.';

update public.service_groups set submits_financials = true where slug = 'finance';

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------
--
-- The client owns its figures and staff can see them. Partners get no table
-- access at all — they write through the function below, which is the same
-- shape the purchase-order and payment work used: a narrow SECURITY DEFINER
-- entry point instead of a broad grant.

alter table public.client_financials enable row level security;

create policy client_financials_select_own on public.client_financials
  for select to authenticated
  using (public.is_staff() or client_id = public.current_client_id());

grant select on public.client_financials to authenticated;

/**
 * True when the caller may submit figures for this client: a provider in a
 * work group that both carries the financial responsibility and covers the
 * client's active package.
 *
 * Deliberately not gated on the premium tier. Supplying figures is the job the
 * finance partner was engaged for; seeing who the client is remains a separate
 * question answered by can_see_client_identity.
 */
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
        and g.submits_financials
        and g.active
        and cp.client_id = p_client_id
        and cp.status = 'active'
    ),
    false
  );
$$;

comment on function public.can_submit_client_financials(uuid) is
  'True when the caller is a partner in a financial-responsibility work group covering this client.';

/**
 * Records one week of figures.
 *
 * Upserts on the week so a correction replaces the previous submission rather
 * than adding a second set that every sum would then double.
 */
create or replace function public.submit_client_financials(
  p_client_id uuid,
  p_fiscal_year smallint,
  p_fiscal_quarter smallint,
  p_fiscal_week smallint,
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

  insert into public.client_financials (
    client_id, fiscal_year, fiscal_quarter, fiscal_week,
    net_income, non_cash_expenses, working_capital_change,
    earnings, taxes, depreciation, amortisation,
    current_assets, current_liabilities, total_liabilities, total_equity,
    lost_customers, total_customers, submitted_by_provider_id
  )
  values (
    p_client_id, p_fiscal_year, p_fiscal_quarter, p_fiscal_week,
    p_net_income, p_non_cash_expenses, p_working_capital_change,
    p_earnings, p_taxes, p_depreciation, p_amortisation,
    p_current_assets, p_current_liabilities, p_total_liabilities, p_total_equity,
    p_lost_customers, p_total_customers, v_provider
  )
  on conflict (client_id, fiscal_year, fiscal_quarter, fiscal_week) do update set
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

/**
 * The clients a finance partner may submit for, with the Customer ID it knows
 * them by. Business identity is filled in only where the partner is entitled
 * to it under the existing rule, so a standard partner sees a Customer ID and
 * nothing more.
 */
create or replace view public.financial_submission_clients
with (security_invoker = off)
as
select
  c.id,
  c.external_reference,
  case when public.can_see_client_identity(c.id) then c.business_name end as business_name
from public.clients c
where public.can_submit_client_financials(c.id);

comment on view public.financial_submission_clients is
  'Clients the calling finance partner may submit figures for. Names appear only where the partner is already entitled to them.';

grant select on public.financial_submission_clients to authenticated;
