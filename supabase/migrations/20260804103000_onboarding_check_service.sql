-- Service behind the onboarding self-check
--
-- When an account goes live, BluBook raises one request against this service,
-- attaches a document to it, and closes it. That proves the request pipeline
-- and the archive both work for a brand-new account, and gives the client a
-- first item in their workspace.
--
-- It is reference data the onboarding code looks up by slug, so it belongs in a
-- migration rather than a seed script: without it, onboarding would fail in a
-- fresh environment.
--
-- active = false keeps it out of the client's service picker, which filters on
-- active. The foreign key from service_requests does not care about the flag,
-- so requests can still reference it.
--
-- group_id stays null so route_request can never match a partner to it. This is
-- BluBook checking itself; no partner should ever see the test document.

insert into public.services (slug, name, description, active, group_id)
values (
  'blubook-onboarding-check',
  'BluBook Onboarding Check',
  'Raised automatically when an account goes live, to confirm requests and the document archive are working. Closed immediately.',
  false,
  null
)
on conflict (slug) do nothing;
