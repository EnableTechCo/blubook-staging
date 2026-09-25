-- Remove the invite-led onboarding of 20260924120000.
--
-- That flow is being replaced by a simpler one (staff invite, client
-- completes, one staff approval before go-live), which follows in the next
-- migration. 20260924120000 has been applied to hosted staging, so it stays in
-- the history and this migration undoes it rather than the file being deleted.
--
-- Nothing of value is lost: on hosted staging, when this was written, there
-- were no invites, no client locked out of Finance, and no onboarding awaiting
-- Sales review.
--
-- Order matters. A policy that reads a column is a dependency of it, so every
-- function and policy that 20260924120000 rewrote to read
-- clients.finance_onboarding_complete is restored to its earlier definition
-- first, and only then is the column dropped.
--
-- Kept on purpose: the 'onboarding_review' value it added to notification_type.
-- Postgres cannot drop an enum value, and the next migration uses it.

-- ---------------------------------------------------------------------------
-- Restore the three definitions 20260924120000 replaced
-- ---------------------------------------------------------------------------

-- As in 20260811140000_partner_tiers.sql.
create or replace function public.can_see_client_identity(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- coalesce, because current_client_id() is null for a partner and
  -- `false or null` is null in three-valued logic. The view reads a null as
  -- not-true either way, but a caller writing `not can_see_client_identity(...)`
  -- would get null back and silently match no rows. Always answer true or false.
  select coalesce(
    public.is_staff()
    or p_client_id = public.current_client_id()
    or exists (
      select 1
      from public.providers p
      join public.work_group_members wgm on wgm.provider_id = p.id
      join public.services s on s.group_id = wgm.work_group_id
      join public.line_items li on li.service_id = s.id
      join public.client_package_line_items cpli on cpli.source_line_item_id = li.id
      join public.client_packages cp on cp.id = cpli.client_package_id
      where p.id = public.current_provider_id()
        and p.tier = 'premium'
        and cp.client_id = p_client_id
        -- A lapsed package ends the entitlement along with the work.
        and cp.status = 'active'
    ),
    false
  );
$$;

comment on function public.can_see_client_identity(uuid) is
  'True when the caller may see a client''s business identity: staff, the client itself, or a premium partner whose work group covers that client''s package.';

-- As in 20260812160000_financial_evidence.sql.
create or replace function public.can_submit_client_financials(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.providers p
      join public.work_group_members wgm on wgm.provider_id = p.id
      join public.service_groups g on g.id = wgm.work_group_id
      join public.services s on s.group_id = g.id
      join public.line_items li on li.service_id = s.id
      join public.client_package_line_items cpli on cpli.source_line_item_id = li.id
      join public.client_packages cp on cp.id = cpli.client_package_id
      where p.id = public.current_provider_id()
        and p.tier = 'premium'
        and g.submits_financials
        and g.active
        and cp.client_id = p_client_id
        and cp.status = 'active'
    ),
    false
  );
$$;

comment on function public.can_submit_client_financials(uuid) is
  'True when the caller is a premium partner in a financial-responsibility work group covering this client.';

-- As in 20260813180000_restrict_high_risk_surfaces.sql.
drop policy if exists client_financials_select_own on public.client_financials;
create policy client_financials_select_own on public.client_financials
  for select to authenticated
  using (
    public.has_staff_role('operations')
    or client_id = public.current_client_id()
  );

-- ---------------------------------------------------------------------------
-- Drop what 20260924120000 added
-- ---------------------------------------------------------------------------

drop table if exists public.onboarding_invites;

alter table public.clients
  drop column if exists finance_onboarding_complete;

alter table public.onboardings
  drop column if exists sales_review_status,
  drop column if exists sales_review_note,
  drop column if exists sales_reviewed_by,
  drop column if exists sales_reviewed_at;
