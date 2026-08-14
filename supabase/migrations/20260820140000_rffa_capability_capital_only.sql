-- RFFA capability belongs to the group that delivers RFFA.
--
-- The previous migration moved the service to Capital and left the two Tender
-- Services partners holding the capability. It was already inert — routing
-- needs the partner to be in the service's group, and they are not — but a
-- capability that says a partner does work it can never be sent is a record
-- that lies, and the next person to read it has no way to tell.
--
-- Written as the rule rather than as two names: the capability is withdrawn
-- from anyone outside the group that owns the service. If RFFA moves again,
-- this migration describes what should have happened rather than which two
-- partners happened to hold it in August.
--
-- No RFFA request existed when this ran, so nothing changed hands. Had one
-- been assigned it would have stayed assigned either way: a request records
-- its partner on the row, and a partner's own queue is scoped by provider_id
-- rather than by what they are currently capable of.

delete from public.provider_capabilities c
where c.service_id = (select id from public.services where slug = 'rffa-submission')
  and not exists (
    select 1
    from public.work_group_members m
    join public.services s on s.group_id = m.work_group_id
    where m.provider_id = c.provider_id
      and s.slug = 'rffa-submission'
  );
