-- Tranche 1 of the staff role split: the four surfaces where a wrong role does
-- real damage.
--
--   compliance settings — decides what every client is scored against
--   partner tiers       — lifts client anonymity for a partner
--   onboarding          — creates clients, packages and credentials
--   client financials   — every client's raw finance figures
--
-- Before this, all five staff roles could do all four.

-- ---------------------------------------------------------------------------
-- 1. Compliance settings — admin only
-- ---------------------------------------------------------------------------
--
-- Reading stays open to everyone: a client cannot understand its own score
-- without seeing what it was measured against. Only the writing narrows.

drop policy if exists compliance_metric_settings_write on public.compliance_metric_settings;

create policy compliance_metric_settings_write on public.compliance_metric_settings
  for all to authenticated
  using (public.is_staff_admin())
  with check (public.is_staff_admin());

-- ---------------------------------------------------------------------------
-- 2. Partner tiers — admin only
-- ---------------------------------------------------------------------------
--
-- Tier is a column, and RLS is row-level: providers_update cannot tell "staff
-- editing a provider" apart from "staff promoting one". So the privilege is
-- removed at the column, and the change goes through a function only an admin
-- may call.
--
-- Revoking the column is what makes this real. Without it the policy still
-- admits the update and any staff member could set the tier directly.
--
-- The revoke has to drop the table-level grant first. Postgres treats
-- `grant update on providers` as covering every column, so revoking one column
-- against a live table-wide grant changes nothing at all — measured, and it
-- did not. Every other column is re-granted so nothing else narrows here.

revoke update on public.providers from authenticated;
grant update (id, profile_id, business_name, status, created_at, updated_at)
  on public.providers to authenticated;

/**
 * Promote a partner, or return it to standard.
 *
 * security definer so it can write the column authenticated no longer may.
 * Admin only: promoting a partner exempts it from client anonymity, which is
 * the most consequential switch in the product.
 */
create or replace function public.set_provider_tier(
  p_provider_id uuid,
  p_tier public.provider_tier
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff_admin() then
    raise exception 'Only an administrator may change a partner tier';
  end if;

  update public.providers set tier = p_tier where id = p_provider_id;

  if not found then
    raise exception 'Partner not found';
  end if;
end;
$$;

comment on function public.set_provider_tier(uuid, public.provider_tier) is
  'Admin-only partner tier change. The tier column is not writable by authenticated directly.';

revoke all on function public.set_provider_tier(uuid, public.provider_tier) from public;
grant execute on function public.set_provider_tier(uuid, public.provider_tier) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Onboarding — operations
-- ---------------------------------------------------------------------------
--
-- Creating clients, setting packages and issuing credentials is an operations
-- job. Sales admin can see the queue without acting on it; if they should be
-- able to action a review too, that is one role added to the write policies.

drop policy if exists onboardings_write on public.onboardings;
drop policy if exists onboardings_select on public.onboardings;

create policy onboardings_select on public.onboardings
  for select to authenticated
  using (
    client_id = public.current_client_id()
    or public.has_staff_role('operations', 'sales_admin')
  );

create policy onboardings_write on public.onboardings
  for all to authenticated
  using (public.has_staff_role('operations'))
  with check (public.has_staff_role('operations'));

drop policy if exists onboarding_documents_write on public.onboarding_documents;
drop policy if exists onboarding_documents_select on public.onboarding_documents;

create policy onboarding_documents_select on public.onboarding_documents
  for select to authenticated
  using (
    public.has_staff_role('operations', 'sales_admin')
    or onboarding_id in (
      select o.id from public.onboardings o
      where o.client_id = public.current_client_id()
    )
  );

create policy onboarding_documents_write on public.onboarding_documents
  for all to authenticated
  using (public.has_staff_role('operations'))
  with check (public.has_staff_role('operations'));

-- ---------------------------------------------------------------------------
-- 4. Client financials — operations
-- ---------------------------------------------------------------------------
--
-- The client still reads its own figures, and the partner that files them
-- still cannot read them back — that was never a staff question and does not
-- change here.

drop policy if exists client_financials_select_own on public.client_financials;

create policy client_financials_select_own on public.client_financials
  for select to authenticated
  using (
    public.has_staff_role('operations')
    or client_id = public.current_client_id()
  );
