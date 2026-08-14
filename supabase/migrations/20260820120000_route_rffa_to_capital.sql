-- RFFA is delivered by Capital, not Tender Services.
--
-- RFFA sits with the tender family in the submission form because it carries
-- the same details — a reference, an issuer, a closing date. Who delivers it is
-- a separate question, and the answer is the funding group rather than the
-- tender group.
--
-- Moving the service alone would have stopped RFFA routing altogether. A
-- request reaches a partner through the service's work group *and* an active
-- capability for that service, and Capital's partners hold capabilities for the
-- three funding services only. So the capability is granted here too, to every
-- active partner in Capital rather than to a named one, which keeps this
-- correct whoever is in the group when it runs.
--
-- Nothing was in flight when this ran, so no request changes hands. The two
-- Tender Services partners keep their RFFA capability; it is now inert for
-- routing, the same way any capability outside a partner's groups is, and
-- withdrawing it is a decision about those partners rather than about RFFA.

update public.services
set group_id = (select id from public.service_groups where slug = 'capital')
where slug = 'rffa-submission';

insert into public.provider_capabilities (provider_id, service_id, active)
select m.provider_id, s.id, true
from public.work_group_members m
join public.service_groups g on g.id = m.work_group_id
join public.providers p on p.id = m.provider_id
cross join public.services s
where g.slug = 'capital'
  and s.slug = 'rffa-submission'
  and p.status = 'active'
on conflict (provider_id, service_id) do update set active = true;
