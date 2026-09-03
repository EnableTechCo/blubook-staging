-- A fiscal week is useful for reporting, but it cannot tell a sales manager
-- the calendar date the deal was expected to close. Keep the target date on
-- the opportunity and preserve booked_at as the system-recorded actual date.
alter table public.sales_opportunities
  add column expected_close_date date;

comment on column public.sales_opportunities.expected_close_date is
  'Client-entered target close date, compared with booked_at once a sales order is booked.';
