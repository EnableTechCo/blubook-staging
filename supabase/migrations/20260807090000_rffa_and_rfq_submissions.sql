-- RFFA and RFQ submissions
--
-- Two more client-initiated transactions, both tender-family work, so both are
-- delivered by the Tender work group. Adding the enum values here is safe
-- because nothing in this migration writes them: Postgres only forbids using a
-- new label in the transaction that adds it.

alter type public.request_type add value if not exists 'rffa';
alter type public.request_type add value if not exists 'rfq';

-- The services these submissions are raised against. Both sit in the Tender
-- work group, so route_request matches a Tender partner exactly as it does for
-- a tender submission.
insert into public.services (slug, name, description, active, group_id)
select
  v.slug,
  v.name,
  v.description,
  true,
  (select id from public.service_groups where slug = 'tender-group')
from (values
  (
    'rffa-submission',
    'RFFA',
    'A request for further award information, prepared and issued by a Tender partner.'
  ),
  (
    'rfq-submission',
    'RFQ',
    'A request for quotation, prepared and issued by a Tender partner.'
  )
) as v (slug, name, description)
on conflict (slug) do nothing;
