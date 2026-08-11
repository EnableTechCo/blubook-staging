-- Partner tiers and the premium exemption from client anonymity
--
-- BluBook's default is that a client and a service provider never learn each
-- other's identity, with staff as the intermediary. Premium partners are a
-- deliberate, narrow exemption to that rule:
--
--   * one way only — a premium partner learns who the client is, but the client
--     still never learns which partner is behind the work;
--   * scoped to the partner's own work groups — every client whose package
--     includes a service that group owns, whether or not a request has been
--     routed to that partner yet, so the partner can plan capacity;
--   * business identity only — name, registration and artwork. Contact details
--     are deliberately excluded, so a premium partner still cannot take the
--     relationship off the platform, and staff remain the channel.
--
-- Standard partners keep the original anonymity in full. Their view of the
-- world must be unchanged by this migration.

create type public.provider_tier as enum ('standard', 'premium');

alter table public.providers
  add column tier public.provider_tier not null default 'standard';

comment on column public.providers.tier is
  'Premium partners see the business identity of clients in their work groups. Standard partners see only the Customer ID.';

-- ---------------------------------------------------------------------------
-- The single gate for client identity
-- ---------------------------------------------------------------------------
--
-- Every place that widens beyond the Customer ID must call this, so the rule
-- lives in one statement rather than being restated per view or per query. The
-- finance and compliance figures added later gate on this same function.
--
-- security definer because it has to read providers, memberships and packages
-- past their own RLS to answer the question; it returns only a boolean, so it
-- cannot itself disclose anything.

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

-- ---------------------------------------------------------------------------
-- Client reference lookup, widened for premium partners
-- ---------------------------------------------------------------------------
--
-- Two separate decisions, and keeping them separate is the point:
--
--   the WHERE clause decides which rows the caller sees at all. It keeps every
--   existing case and adds premium partners, who now reach clients in their
--   group even with no request between them.
--
--   the CASE expressions decide whether identity is filled in for a row. A
--   standard partner still gets exactly the rows it got before, with every
--   identity column null — RLS is row-level, so withholding columns has to be
--   done in the projection like this.
--
-- Contact details, addresses, billing and VAT are absent by construction: they
-- are not in the select list, so no predicate change can ever expose them.

create or replace view public.client_references
with (security_invoker = off)
as
select
  c.id,
  c.external_reference,
  case when public.can_see_client_identity(c.id) then c.business_name end as business_name,
  case when public.can_see_client_identity(c.id) then c.registered_name end as registered_name,
  case when public.can_see_client_identity(c.id) then c.trading_name end as trading_name,
  case when public.can_see_client_identity(c.id) then c.entity_type end as entity_type,
  case when public.can_see_client_identity(c.id) then c.registration_number end as registration_number,
  case when public.can_see_client_identity(c.id) then c.industry end as industry,
  case when public.can_see_client_identity(c.id) then c.artwork_path end as artwork_path
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
  )
  or public.can_see_client_identity(c.id);

comment on view public.client_references is
  'Customer ID lookup, scoped to the caller. Business identity columns are filled in only for staff, the client itself, and premium partners whose work group covers the client; everyone else sees the Customer ID alone.';
