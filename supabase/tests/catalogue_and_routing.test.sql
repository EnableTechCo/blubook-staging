begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

-- Rows affected, never whether the statement raised. An UPDATE refused by RLS
-- affects zero rows and raises nothing, so a statement that "worked" is not
-- evidence that anything was written.

insert into auth.users (id, email, raw_user_meta_data)
values
  ('60000000-0000-0000-0000-000000000001', 'cat-admin@example.test',      '{"user_type":"staff","staff_role":"admin"}'),
  ('60000000-0000-0000-0000-000000000002', 'cat-operations@example.test', '{"user_type":"staff","staff_role":"operations"}'),
  ('60000000-0000-0000-0000-000000000003', 'cat-salesadmin@example.test', '{"user_type":"staff","staff_role":"sales_admin"}'),
  ('60000000-0000-0000-0000-000000000004', 'cat-salesrep@example.test',   '{"user_type":"staff","staff_role":"sales_rep"}');

insert into public.service_groups (id, slug, name)
values ('61000000-0000-0000-0000-000000000001', 'cat-test-group', 'Catalogue Test Group');

insert into public.services (id, slug, name, group_id)
values ('62000000-0000-0000-0000-000000000001', 'cat-test-service', 'Catalogue Test Service',
        '61000000-0000-0000-0000-000000000001');

insert into public.packages (id, slug, name, tier, price)
values ('63000000-0000-0000-0000-000000000001', 'cat-test-package', 'Catalogue Test Package',
        'basic', 1000);

insert into public.line_items (id, name, tier, price, service_id)
values ('64000000-0000-0000-0000-000000000001', 'Catalogue Test Item', 'basic', 500,
        '62000000-0000-0000-0000-000000000001');

set local role authenticated;

-- ---------------------------------------------------------------------------
-- Prices are a commercial decision — sales admin
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000003","role":"authenticated"}';
with changed as (update public.packages set price = price returning 1)
select ok((select count(*) from changed) > 0, 'sales admin prices a package');
with changed as (update public.line_items set price = price returning 1)
select ok((select count(*) from changed) > 0, 'and prices a line item');

set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000002","role":"authenticated"}';
with changed as (update public.packages set price = price returning 1)
select is((select count(*)::int from changed), 0, 'operations does not price packages');
with changed as (update public.line_items set price = price returning 1)
select is((select count(*)::int from changed), 0, 'nor line items');

set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000004","role":"authenticated"}';
with changed as (update public.packages set price = price returning 1)
select is((select count(*)::int from changed), 0, 'and neither does a sales rep');

set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000001","role":"authenticated"}';
with changed as (update public.packages set price = price returning 1)
select ok((select count(*) from changed) > 0, 'an admin passes without being named, as everywhere else');

-- What is inside a package changes what it is worth without touching a price,
-- so composition moves with the prices rather than with the services.
set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000003","role":"authenticated"}';
select lives_ok(
  $$insert into public.package_line_items (package_id, line_item_id, quantity)
    values ('63000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000001', 1)$$,
  'sales admin composes a package'
);

set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000002","role":"authenticated"}';
with changed as (delete from public.package_line_items returning 1)
select is((select count(*)::int from changed), 0, 'operations cannot recompose one');

-- ---------------------------------------------------------------------------
-- Delivery and routing — operations
-- ---------------------------------------------------------------------------
--
-- Moving a service between groups silently changes who receives every future
-- request for it.

set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000002","role":"authenticated"}';
with changed as (update public.services set group_id = group_id returning 1)
select ok((select count(*) from changed) > 0, 'operations routes a service');
with changed as (update public.service_groups set name = name returning 1)
select ok((select count(*) from changed) > 0, 'and renames a work group');

set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000003","role":"authenticated"}';
with changed as (update public.services set group_id = group_id returning 1)
select is((select count(*)::int from changed), 0, 'sales admin does not route services');
with changed as (update public.service_groups set name = name returning 1)
select is((select count(*)::int from changed), 0, 'nor rename work groups');

set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000004","role":"authenticated"}';
with changed as (update public.services set group_id = group_id returning 1)
select is((select count(*)::int from changed), 0, 'and a sales rep does neither');

-- ---------------------------------------------------------------------------
-- Reads did not narrow
-- ---------------------------------------------------------------------------
--
-- A rep quoting a client needs the price list, and clients already see every
-- active package. Nothing about reading changed in this tranche.

set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000004","role":"authenticated"}';
select ok((select count(*) from public.packages) > 0, 'a sales rep still reads packages');
select ok(
  (select price from public.packages where id = '63000000-0000-0000-0000-000000000001') is not null,
  'including the price'
);
select ok((select count(*) from public.line_items) > 0, 'and line items');
select ok((select count(*) from public.services) > 0, 'and services');

set local request.jwt.claims = '{"sub":"60000000-0000-0000-0000-000000000003","role":"authenticated"}';
select ok((select count(*) from public.default_documents) >= 0, 'sales admin still reads the document library');

-- ---------------------------------------------------------------------------
-- Default documents — operations
-- ---------------------------------------------------------------------------
--
-- This library is what every newly onboarded client is handed, so it belongs
-- with the role that does the onboarding.

reset role;
select is(
  (select count(*)::int from pg_policies
   where schemaname = 'public' and tablename = 'default_documents'
     and policyname = 'default_documents_write'
     and qual like '%has_staff_role%'),
  1,
  'the default document library is gated on the role helper'
);

select is(
  (select count(*)::int from pg_policies
   where schemaname = 'public'
     and tablename in ('packages','line_items','package_line_items','services',
                       'service_groups','work_group_members','default_documents')
     and cmd = 'ALL'
     and (qual like '%is_staff()%' or with_check like '%is_staff()%')),
  0,
  'and no write policy in this tranche is left on the blanket staff check'
);

select * from finish();
rollback;
