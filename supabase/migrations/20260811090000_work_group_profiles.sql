-- Work group profiles
--
-- The seven partner-facing work groups the brief names, plus Sales Operations,
-- which stays internal to BluBook.
--
-- Existing groups are renamed in place rather than replaced. Services,
-- memberships, routed requests, default documents and group conversations all
-- reference these rows by id, so renaming keeps every attachment and the whole
-- request history pointing at the same group. Creating fresh rows and
-- deactivating the old ones would split reporting across two sets of groups for
-- no benefit.
--
-- Matching on slug rather than name: the slug is the stable identifier, and the
-- names are exactly what this migration is changing.

update public.service_groups set slug = 'human-resources',  name = 'Human Resources'  where slug = 'hr-group';
update public.service_groups set slug = 'marketing',        name = 'Marketing'        where slug = 'marketing-group';
update public.service_groups set slug = 'logistics',        name = 'Logistics'        where slug = 'warehouse-group';
update public.service_groups set slug = 'finance',          name = 'Finance'          where slug = 'finance-work-group';
update public.service_groups set slug = 'tender-services',  name = 'Tender Services'  where slug = 'tender-group';
update public.service_groups set slug = 'sales-operations', name = 'Sales Operations' where slug = 'sales-group';

-- The two groups with no existing equivalent. They start with no services and
-- no members; staff attach those the same way they do for any other group.
insert into public.service_groups (slug, name)
values
  ('capital', 'Capital'),
  ('customer-care', 'Customer Care')
on conflict (slug) do nothing;

-- Sales Operations is BluBook's own desk rather than a partner practice, so it
-- is excluded from the client-facing profile list while still routing work
-- exactly as it does today.
alter table public.service_groups
  add column if not exists internal boolean not null default false;

comment on column public.service_groups.internal is
  'Internal groups are BluBook''s own desks. They route work normally but are hidden from the client-facing work group profile list.';

update public.service_groups set internal = true where slug = 'sales-operations';
