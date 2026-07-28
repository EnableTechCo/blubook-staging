-- Line item fulfilment mode
--
-- Every line item currently becomes a service request routed to a Service
-- Partner. Some deliverables are handled by the platform itself and need no
-- partner and no request, so a line item now declares how it is actioned:
--
--   service_request  a request is generated and routed to a Service Partner
--   automatic        the platform actions it; no request, no provider
--
-- Existing line items keep today's behaviour by defaulting to service_request.
--
-- The mode is snapshotted onto the client's package line items alongside name
-- and price, so changing a catalogue item later cannot retroactively change how
-- an already-purchased package was to be actioned.

create type public.fulfilment_mode as enum ('service_request', 'automatic');

alter table public.line_items
  add column fulfilment_mode public.fulfilment_mode not null default 'service_request';

comment on column public.line_items.fulfilment_mode is
  'How the deliverable is actioned: a routed service request, or automatically by the platform.';

alter table public.client_package_line_items
  add column fulfilment_mode public.fulfilment_mode not null default 'service_request';

comment on column public.client_package_line_items.fulfilment_mode is
  'Fulfilment mode agreed at purchase, snapshotted from the catalogue line item.';

-- Bring existing snapshots in line with the item they were taken from.
update public.client_package_line_items snap
set fulfilment_mode = li.fulfilment_mode
from public.line_items li
where snap.source_line_item_id = li.id;
