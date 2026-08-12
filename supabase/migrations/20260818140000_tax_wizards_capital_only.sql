-- Tax Wizards becomes a Capital partner and nothing else.
--
-- Its only group is already Capital, so the group side is done. What remained
-- was the Tax Filing capability it kept from before, which said it did finance
-- work it is no longer meant to pick up.
--
-- Removing it changes no routing that was actually happening. Tax Filing
-- belongs to the Finance group and route_request requires membership of the
-- service's group, so a partner outside Finance was never a candidate for it —
-- the capability was already inert, and this makes the record say so. Finance
-- keeps three partners who hold the capability and are in the group.
--
-- Work already assigned is untouched. Two Tax Filing requests were in flight
-- with Tax Wizards when this ran, and both stay with them: assignment is
-- recorded on the request, and a partner's own requests are scoped by
-- provider_id rather than by what they are currently capable of, so neither
-- disappears from their queue and both can still be finished.

delete from public.provider_capabilities
where provider_id = (select id from public.providers where business_name = 'Tax Wizards')
  and service_id  = (select id from public.services where slug = 'tax-filing');
