-- Customer ID as the single client identifier
--
-- Requests used to show a partner a pseudonym derived from the client's UUID
-- (Client-D5D3), because clients_select only admits the client itself and
-- staff. That kept the two parties anonymous but left three identifier spaces
-- for one client — CUS-000012 for staff, Client-D5D3 for the partner, and
-- nothing at all for the client — so a partner quoting a reference gave staff
-- nothing they could search on.
--
-- The Customer ID becomes the one identifier everyone uses. It names nobody, so
-- a partner learns no more from it than from the pseudonym it replaces.
--
-- Row level security cannot help here: it filters rows, not columns, so
-- widening clients_select to admit partners would also expose registered_name,
-- addresses and VAT number. This view projects the two safe columns instead and
-- deliberately runs with definer rights, so reading it can never reach anything
-- else on clients.

create view public.client_references
with (security_invoker = off)
as
select id, external_reference
from public.clients;

comment on view public.client_references is
  'Customer ID lookup. Exposes only the id and its Customer ID, so a partner can identify a client without learning anything about them.';

grant select on public.client_references to authenticated;
grant select on public.client_references to service_role;
