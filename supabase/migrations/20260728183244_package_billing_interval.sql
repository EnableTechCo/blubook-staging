-- Package billing intervals
--
-- Standard packages carry a set price but no sense of how often it recurs.
-- Adding the term lets staff distinguish a monthly retainer from a one-off
-- engagement, and it is snapshotted onto a client package at purchase alongside
-- the price so the agreed term survives later catalogue edits.
--
-- This records the term only. There is no billing engine here: nothing charges,
-- invoices, or schedules from these values yet.

create type public.billing_interval as enum (
  'monthly', 'quarterly', 'annual', 'one_time'
);

alter table public.packages
  add column billing_interval public.billing_interval not null default 'monthly';

comment on column public.packages.billing_interval is
  'How often the package price recurs. Recorded only; no billing engine reads it yet.';

-- Snapshotted at purchase, like name/price, so a later catalogue change cannot
-- rewrite what a client agreed to. Nullable because Flex packages are assembled
-- from individually priced line items rather than a package term.
alter table public.client_packages
  add column billing_interval public.billing_interval;

comment on column public.client_packages.billing_interval is
  'Term agreed at purchase, snapshotted from the source package.';

-- Existing standard client packages inherit their source package's term.
update public.client_packages cp
set billing_interval = p.billing_interval
from public.packages p
where cp.source_package_id = p.id
  and cp.type = 'standard'
  and cp.billing_interval is null;
