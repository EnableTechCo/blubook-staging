-- Staff the Capital work group.
--
-- Capital got its services in the previous migration and had nobody to do them,
-- so every request would have routed to the group and then waited. Tax Wizards
-- is the one partner belonging to no group at all, so this puts an idle partner
-- to work without pulling the finance partners into a second group and changing
-- the load on Finance.
--
-- Membership alone routes nothing. route_request matches on the work group and
-- on an active capability for the specific service, so a partner added to a
-- group without capabilities is still skipped and the request still waits. Both
-- halves have to be here.
--
-- Customer Care is deliberately left unstaffed for now; its requests continue
-- to wait in that group's queue until it has partners of its own.

insert into public.work_group_members (work_group_id, provider_id)
select g.id, p.id
from public.service_groups g, public.providers p
where g.slug = 'capital' and p.business_name = 'Tax Wizards'
on conflict do nothing;

insert into public.provider_capabilities (provider_id, service_id, active)
select p.id, s.id, true
from public.providers p, public.services s
where p.business_name = 'Tax Wizards'
  and s.slug in ('funding-application', 'asset-finance', 'invoice-discounting')
on conflict (provider_id, service_id) do update set active = true;
