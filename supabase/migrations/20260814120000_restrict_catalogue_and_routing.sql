-- Tranche 2 of the staff role split: the catalogue, the default document
-- library, and work group routing.
--
-- These are not as dangerous as the four surfaces in the previous tranche —
-- nothing here exposes a client's identity or their finances — but they decide
-- what the business sells, at what price, what every new client is asked to
-- provide, and which partners receive which work. All of it was writable by any
-- staff login.
--
-- The split follows the money and delivery line rather than the screen:
--
--   packages, line items, prices  -> sales admin   (a commercial decision)
--   services, groups, routing     -> operations    (a delivery decision)
--   default documents            -> operations    (what a client must provide)
--
-- Reads are deliberately untouched. A rep quoting a client needs the price
-- list, clients already see every active package, and a score or a quote is
-- meaningless without the thing it refers to. Only the writing narrows.

-- ---------------------------------------------------------------------------
-- 1. The commercial catalogue — sales admin
-- ---------------------------------------------------------------------------
--
-- packages and line_items carry price. package_line_items decides what is
-- inside a package, which changes what a package is worth without touching a
-- price at all, so it moves with them rather than with services.

drop policy if exists packages_write on public.packages;

create policy packages_write on public.packages
  for all to authenticated
  using (public.has_staff_role('sales_admin'))
  with check (public.has_staff_role('sales_admin'));

drop policy if exists line_items_write on public.line_items;

create policy line_items_write on public.line_items
  for all to authenticated
  using (public.has_staff_role('sales_admin'))
  with check (public.has_staff_role('sales_admin'));

drop policy if exists package_line_items_write on public.package_line_items;

create policy package_line_items_write on public.package_line_items
  for all to authenticated
  using (public.has_staff_role('sales_admin'))
  with check (public.has_staff_role('sales_admin'));

-- ---------------------------------------------------------------------------
-- 2. Services and routing — operations
-- ---------------------------------------------------------------------------
--
-- A service is what gets delivered and a work group decides who delivers it.
-- Moving a service between groups silently changes who receives every future
-- request for it, which is why this sits with the people who answer for the
-- work rather than the people who price it.

drop policy if exists services_write on public.services;

create policy services_write on public.services
  for all to authenticated
  using (public.has_staff_role('operations'))
  with check (public.has_staff_role('operations'));

drop policy if exists service_groups_write on public.service_groups;

create policy service_groups_write on public.service_groups
  for all to authenticated
  using (public.has_staff_role('operations'))
  with check (public.has_staff_role('operations'));

drop policy if exists work_group_members_write on public.work_group_members;

create policy work_group_members_write on public.work_group_members
  for all to authenticated
  using (public.has_staff_role('operations'))
  with check (public.has_staff_role('operations'));

-- ---------------------------------------------------------------------------
-- 3. Default documents — operations
-- ---------------------------------------------------------------------------
--
-- This library is what every newly onboarded client is handed, so it belongs
-- with the role that does the onboarding. Reading stays open to all staff: the
-- list is not sensitive, and a rep answering "what will you need from me?"
-- should be able to say.

drop policy if exists default_documents_write on public.default_documents;

create policy default_documents_write on public.default_documents
  for all to authenticated
  using (public.has_staff_role('operations'))
  with check (public.has_staff_role('operations'));
