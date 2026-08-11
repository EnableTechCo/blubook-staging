-- Client sales targets
--
-- Every phasing chart in the workbook plots Actual against Target, and the
-- Sales Dash leads with a quarterly target tile, but nothing in the system has
-- ever stored a target. This is that missing input.
--
-- The target is quarterly, not weekly. The workbook's own sample phases a
-- R780 000 quarter evenly across thirteen weeks — R60 000 a week, dead flat —
-- so a single quarterly figure reproduces it exactly while asking the client
-- for one number instead of thirteen. Uneven phasing can be added later
-- without moving what is stored here.
--
-- Clients own their own targets outright: they set them, no one approves them,
-- and they stand as entered. That is a deliberate decision, and it means the
-- Weighted Compliance Ratio measures a client against a bar it chose itself.

create table public.client_sales_targets (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null default public.current_client_id() references public.clients (id) on delete cascade,
  fiscal_year    smallint not null check (fiscal_year between 2000 and 2200),
  fiscal_quarter smallint not null check (fiscal_quarter between 1 and 4),
  revenue_target numeric(14, 2) not null default 0 check (revenue_target >= 0),
  -- Matches sales_opportunities: the platform is single-currency for now, and
  -- the constraint makes that explicit rather than implied.
  currency       text not null default 'ZAR' check (currency = 'ZAR'),
  -- Defaulted rather than passed in by the caller, the same way client_id is:
  -- an upsert that revises a target does not name this column, so the original
  -- author survives the revision instead of being overwritten by whoever
  -- edited last.
  created_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- One target per quarter. Revising a target updates this row rather than
  -- adding a second one that would silently double the bar.
  constraint client_sales_targets_unique_quarter unique (client_id, fiscal_year, fiscal_quarter)
);

comment on table public.client_sales_targets is
  'Client-owned quarterly revenue target. Phased evenly across the thirteen weeks of its quarter when charted.';

create index client_sales_targets_client_period_idx
  on public.client_sales_targets (client_id, fiscal_year, fiscal_quarter);

create trigger client_sales_targets_set_updated_at
  before update on public.client_sales_targets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Ownership
-- ---------------------------------------------------------------------------
--
-- Mirrors sales_opportunities: a client reaches only its own rows, and neither
-- partners nor staff are given table access. A target names no counterparty,
-- so nothing here touches the anonymity rule.

alter table public.client_sales_targets enable row level security;

create policy client_sales_targets_select_own on public.client_sales_targets
  for select to authenticated
  using (client_id = public.current_client_id());

create policy client_sales_targets_insert_own on public.client_sales_targets
  for insert to authenticated
  with check (client_id = public.current_client_id());

create policy client_sales_targets_update_own on public.client_sales_targets
  for update to authenticated
  using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());

-- Deletion is allowed because the client owns the figure outright and may set
-- a quarter back to having no target at all. Zero and absent mean different
-- things on a chart: zero is a target of nothing, absent is no line to plot.
create policy client_sales_targets_delete_own on public.client_sales_targets
  for delete to authenticated
  using (client_id = public.current_client_id());

grant select, insert, update, delete on public.client_sales_targets to authenticated;
