-- Weekly sales targets alongside the quarterly one
--
-- A quarterly target phased evenly is the right default — it asks for one
-- number and reproduces the workbook — but a real quarter is rarely flat. A
-- client who knows week nine carries a large delivery should be able to say so
-- without abandoning the quarterly figure.
--
-- So this is one more column rather than a second table. A row with no week is
-- the quarter's total, exactly as before; a row with a week is that week's
-- target. Same ownership, same policies, same page.

alter table public.client_sales_targets
  add column fiscal_week smallint check (fiscal_week between 1 and 13);

comment on column public.client_sales_targets.fiscal_week is
  'Null for the quarter total. 1-13 for a single week''s target, which overrides the even phasing for that week.';

-- NULLS NOT DISTINCT so the quarter row still collides with itself: without it
-- a client could store two quarter totals for the same quarter, because SQL
-- treats each null as different from every other null.
alter table public.client_sales_targets
  drop constraint client_sales_targets_unique_quarter;

alter table public.client_sales_targets
  add constraint client_sales_targets_unique_period
  unique nulls not distinct (client_id, fiscal_year, fiscal_quarter, fiscal_week);

comment on table public.client_sales_targets is
  'Client-owned revenue targets. One row per quarter for the total, plus optional rows per week that reshape how it is phased.';
