-- Scope the Customer ID lookup to the caller
--
-- The first version of this view had no predicate and granted select to
-- authenticated, so any client or partner could enumerate every client UUID and
-- Customer ID — not only the ones they deal with. A client involved with one
-- account could read all of them, and because Customer IDs are sequential that
-- also disclosed the total customer count and how fast it grows.
--
-- The predicate below mirrors service_requests_select: you may read a client's
-- Customer ID exactly when you could already see a request belonging to them,
-- when you are that client, or when you are staff.
--
-- The view stays security-definer on purpose. It has to read clients and
-- service_requests past their own RLS to evaluate that predicate, and it still
-- projects only the two safe columns, so it can never reach a name, an address
-- or a VAT number.

create or replace view public.client_references
with (security_invoker = off)
as
select c.id, c.external_reference
from public.clients c
where
  public.is_staff()
  or c.id = public.current_client_id()
  or exists (
    select 1
    from public.service_requests sr
    where sr.client_id = c.id
      and (
        sr.provider_id = public.current_provider_id()
        or sr.created_by = (select auth.uid())
      )
  );

comment on view public.client_references is
  'Customer ID lookup, scoped to the caller: staff, the client itself, or a partner with a request for that client. Projects only the id and Customer ID.';
