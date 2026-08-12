-- Weighted Compliance Ratio, urgent notifications, and a trail on targets
--
-- The brief measures a client against the finance dashboard: each metric has a
-- weight staff decide, and the WCR is how much of that weight the client is
-- currently carrying. A weight alone cannot say whether a metric was achieved,
-- so staff set a threshold too — a debt-to-equity of 40% is good or bad only
-- against a number somebody chose.

-- ---------------------------------------------------------------------------
-- What staff set
-- ---------------------------------------------------------------------------

-- Some metrics are better high and some better low: more working capital is
-- good, more churn is not. Without this the threshold could not be read.
create type public.metric_direction as enum ('higher_is_better', 'lower_is_better');

create table public.compliance_metric_settings (
  metric_key  text primary key,
  label       text not null,
  weight      numeric(6, 2) not null default 1 check (weight >= 0),
  threshold   numeric(16, 2) not null default 0,
  direction   public.metric_direction not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.compliance_metric_settings is
  'Staff-set weight and threshold for each finance metric the Weighted Compliance Ratio scores.';

create trigger compliance_metric_settings_set_updated_at
  before update on public.compliance_metric_settings
  for each row execute function public.set_updated_at();

-- Seeded to match the six metrics on the Finance Dashboard. The thresholds are
-- opening positions for staff to adjust, not claims about what any particular
-- business should hit.
insert into public.compliance_metric_settings (metric_key, label, weight, threshold, direction)
values
  ('operating_cash_flow', 'Current operating cash flow', 1, 0,   'higher_is_better'),
  ('ebitda',              'QTD EBITDA',                  1, 0,   'higher_is_better'),
  ('working_capital',     'Working capital',             1, 0,   'higher_is_better'),
  ('debt_to_equity',      'Debt to equity',              1, 100, 'lower_is_better'),
  ('current_ratio',       'Current ratio',               1, 100, 'higher_is_better'),
  ('churn',               'Churn rate',                  1, 10,  'lower_is_better');

alter table public.compliance_metric_settings enable row level security;

-- Everyone may read them: a client cannot understand its own score without
-- knowing what it was measured against. Only staff may change them.
create policy compliance_metric_settings_select on public.compliance_metric_settings
  for select to authenticated using (true);

create policy compliance_metric_settings_write on public.compliance_metric_settings
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

grant select on public.compliance_metric_settings to authenticated;
grant insert, update, delete on public.compliance_metric_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Urgent notifications
-- ---------------------------------------------------------------------------
--
-- The brief is explicit that the bell is for urgent notifications and not for
-- every overdue request. Overdue requests still raise a notification — they
-- just do not ring the bell. That is a property of the notification rather
-- than of its type, so it is a flag: a request_status notification can be
-- urgent when it matters and ordinary when it does not.

alter table public.notifications
  add column urgent boolean not null default false;

comment on column public.notifications.urgent is
  'Only urgent notifications are counted by the bell. Overdue requests notify without ringing it.';

create index notifications_urgent_unread_idx
  on public.notifications (recipient_id)
  where urgent and read_at is null;

alter type public.notification_type add value if not exists 'compliance_ratio';

-- ---------------------------------------------------------------------------
-- A trail on targets
-- ---------------------------------------------------------------------------
--
-- Targets are client-set and stand as entered, which was fine while nothing
-- measured them. The WCR now does, so a target that moves mid-quarter needs to
-- leave a mark. Append-only: the row records what changed, and nothing updates
-- or deletes it.

create table public.client_sales_target_events (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  fiscal_year    smallint not null,
  fiscal_quarter smallint not null,
  fiscal_week    smallint,
  previous_target numeric(14, 2),
  new_target      numeric(14, 2),
  changed_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);

comment on table public.client_sales_target_events is
  'Append-only record of every change to a sales target, so a target that moves under a compliance measure leaves a trail.';

create index client_sales_target_events_client_idx
  on public.client_sales_target_events (client_id, created_at desc);

alter table public.client_sales_target_events enable row level security;

create policy client_sales_target_events_select on public.client_sales_target_events
  for select to authenticated
  using (public.is_staff() or client_id = public.current_client_id());

grant select on public.client_sales_target_events to authenticated;

create or replace function public.log_sales_target_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.client_sales_target_events (
    client_id, fiscal_year, fiscal_quarter, fiscal_week,
    previous_target, new_target, changed_by
  )
  values (
    coalesce(new.client_id, old.client_id),
    coalesce(new.fiscal_year, old.fiscal_year),
    coalesce(new.fiscal_quarter, old.fiscal_quarter),
    coalesce(new.fiscal_week, old.fiscal_week),
    case when tg_op = 'INSERT' then null else old.revenue_target end,
    case when tg_op = 'DELETE' then null else new.revenue_target end,
    (select auth.uid())
  );
  return coalesce(new, old);
end;
$$;

create trigger client_sales_targets_log_change
  after insert or update or delete on public.client_sales_targets
  for each row execute function public.log_sales_target_change();
