-- A quotation may raise a pipeline opportunity.
--
-- Optional on purpose. A client quoting a walk-in customer for two items does
-- not want that in its forecast, and a client quoting a deal it is working does.
-- The choice belongs to the person raising it, so the link is a nullable column
-- rather than a rule.
--
-- set null on delete rather than cascade: an opportunity can be deleted before
-- it is booked, and losing the quotation with it would destroy a record of what
-- was actually sent to a customer.

alter table public.quotations
  add column opportunity_id uuid references public.sales_opportunities (id) on delete set null;

create index quotations_opportunity_idx
  on public.quotations (opportunity_id)
  where opportunity_id is not null;

-- One quotation per opportunity. Two quotations pointing at one opportunity
-- would make the forecast figure ambiguous — it would be whichever was written
-- last, silently.
create unique index quotations_opportunity_unique
  on public.quotations (opportunity_id)
  where opportunity_id is not null;

comment on column public.quotations.opportunity_id is
  'The pipeline opportunity this quotation raised, when the client asked for one.';
