-- Tranche 3 of the staff role split: who may change a person's privileges, and
-- who may change a customer's record.
--
-- The first half of this migration is the important one. Everything the two
-- previous tranches did was defeatable in a single statement.

-- ---------------------------------------------------------------------------
-- 1. Privilege escalation
-- ---------------------------------------------------------------------------
--
-- profiles.staff_role was writable by anyone the guard trigger considered
-- staff, and the trigger's first act was to wave through every staff caller
-- regardless of what they were changing. So any staff member could run
--
--   update profiles set staff_role = 'admin' where id = auth.uid()
--
-- and become an administrator. Measured on the live database before this
-- change: a marketing login raised itself to admin, one row affected. That
-- makes compliance thresholds, partner tiers, client financials and onboarding
-- reachable by every staff role again — the earlier tranches were decorative
-- while this stood.
--
-- The trigger now checks *what* changed rather than *who* is asking, and only
-- an administrator may change the three columns that confer power. Note this
-- also refuses the service role: no server action needs to write these columns
-- today, and if one ever does it should fail loudly rather than quietly become
-- the way around this rule.

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_type is distinct from old.user_type
     or new.staff_role is distinct from old.staff_role
     or new.status is distinct from old.status then
    if not public.is_staff_admin() then
      raise exception
        'Only an administrator may change user_type, staff_role, or status';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.guard_profile_privileges() is
  'Only an administrator may change user_type, staff_role or status. Everything else on a profile is governed by RLS alone.';

-- ---------------------------------------------------------------------------
-- 2. Customer records — everyone reads, operations writes
-- ---------------------------------------------------------------------------
--
-- Reading stays open to every staff role on purpose: a rep needs the customer
-- list to sell, marketing needs it to segment, and none of it is the client's
-- finances, which left the shared surface in the first tranche.
--
-- Writing is a different question. A client record is created by onboarding and
-- corrected by the people who run it, and an edit here changes the business
-- name, the trading name and the primary contact that every downstream document
-- is addressed to.

drop policy if exists clients_write on public.clients;

create policy clients_write on public.clients
  for all to authenticated
  using (public.has_staff_role('operations'))
  with check (public.has_staff_role('operations'));

-- What a specific client was actually sold. The catalogue that these are
-- assembled from is priced by sales admin, but an assembled client package is
-- part of that client's record and is written during onboarding.

drop policy if exists client_packages_write on public.client_packages;

create policy client_packages_write on public.client_packages
  for all to authenticated
  using (public.has_staff_role('operations'))
  with check (public.has_staff_role('operations'));

drop policy if exists client_package_line_items_write on public.client_package_line_items;

create policy client_package_line_items_write on public.client_package_line_items
  for all to authenticated
  using (public.has_staff_role('operations'))
  with check (public.has_staff_role('operations'));

-- The compliance checklist: which documents a new client is asked for. This
-- sits with operations rather than with the compliance thresholds, which are
-- admin-only. Deciding what to collect is onboarding work; deciding what a
-- client is scored against is not.

drop policy if exists compliance_document_types_write on public.compliance_document_types;

create policy compliance_document_types_write on public.compliance_document_types
  for all to authenticated
  using (public.has_staff_role('operations'))
  with check (public.has_staff_role('operations'));
