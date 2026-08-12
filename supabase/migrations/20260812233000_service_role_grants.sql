-- Grant the service role access to the tables added in this tranche
--
-- Supabase grants anon, authenticated and service_role on tables created
-- through its own tooling. These five were created by migrations that granted
-- only to `authenticated`, so the service role — the identity every privileged
-- server path runs as — was refused with a 403.
--
-- Nothing had broken yet because nothing used the admin client against them.
-- The compliance notification is the first thing that does, and it silently
-- read zero rows: no error, no notification, just a client that always looked
-- compliant. That is the worst shape a permissions bug can take, so the grants
-- are fixed here rather than worked around in the query.
--
-- RLS still applies to everyone else. The service role bypasses it by design,
-- which is why it is only ever used from server code that has already
-- authorised the caller.

grant all on public.client_financials              to service_role;
grant all on public.client_sales_targets           to service_role;
grant all on public.client_sales_target_events     to service_role;
grant all on public.compliance_metric_settings     to service_role;
grant select on public.financial_submission_clients to service_role;

-- Sequences behind those tables, so a privileged insert can obtain an id.
grant usage, select on all sequences in schema public to service_role;
