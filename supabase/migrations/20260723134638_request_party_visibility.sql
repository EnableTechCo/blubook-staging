-- Request-party visibility
--
-- The service-request tracking view needs each party to see the other's name on
-- a shared request: a client should see the provider assigned to its request
-- (the overview: clients "learn their assigned provider through service
-- requests"), and a provider should see the client of a request assigned to it.
-- These are additive SELECT policies scoped strictly to shared requests.

-- A client may read providers assigned to any of its requests.
create policy providers_select_for_client on public.providers
  for select to authenticated
  using (
    id in (
      select provider_id from public.service_requests
      where client_id = public.current_client_id() and provider_id is not null
    )
  );

-- A provider may read clients of requests assigned to it.
create policy clients_select_for_provider on public.clients
  for select to authenticated
  using (
    id in (
      select client_id from public.service_requests
      where provider_id = public.current_provider_id()
    )
  );
