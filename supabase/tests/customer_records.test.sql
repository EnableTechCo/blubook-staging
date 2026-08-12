begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('70000000-0000-0000-0000-000000000001', 'cust-admin@example.test',      '{"user_type":"staff","staff_role":"admin"}'),
  ('70000000-0000-0000-0000-000000000002', 'cust-operations@example.test', '{"user_type":"staff","staff_role":"operations"}'),
  ('70000000-0000-0000-0000-000000000003', 'cust-salesrep@example.test',   '{"user_type":"staff","staff_role":"sales_rep"}'),
  ('70000000-0000-0000-0000-000000000004', 'cust-marketing@example.test',  '{"user_type":"staff","staff_role":"marketing"}'),
  ('70000000-0000-0000-0000-000000000005', 'cust-client@example.test',     '{"user_type":"client"}');

insert into public.clients (id, business_name, registered_name, trading_name)
values ('71000000-0000-0000-0000-000000000001', 'Fixture Co', 'Fixture Co (Pty) Ltd', 'Fixture');

insert into public.compliance_document_types (id, slug, name)
values ('72000000-0000-0000-0000-000000000001', 'cust-test-doc', 'Customer Test Document');

set local role authenticated;

-- ---------------------------------------------------------------------------
-- Privilege escalation
-- ---------------------------------------------------------------------------
--
-- This is the assertion the whole role split rests on. Before this migration a
-- marketing login could run one statement and become an administrator, which
-- put compliance thresholds, partner tiers, client financials and onboarding
-- back within reach of every staff role.

set local request.jwt.claims = '{"sub":"70000000-0000-0000-0000-000000000004","role":"authenticated"}';
select throws_ok(
  $$update public.profiles set staff_role = 'admin'
    where id = '70000000-0000-0000-0000-000000000004'$$,
  'Only an administrator may change user_type, staff_role, or status',
  'marketing cannot promote itself to admin'
);
select is(
  (select staff_role::text from public.profiles where id = '70000000-0000-0000-0000-000000000004'),
  'marketing',
  'and its role is unchanged'
);

select throws_ok(
  $$update public.profiles set staff_role = 'admin'
    where id = '70000000-0000-0000-0000-000000000003'$$,
  'Only an administrator may change user_type, staff_role, or status',
  'nor promote somebody else'
);

-- A real change: marketing is already staff, and the guard only fires on a
-- column that actually moves.
select throws_ok(
  $$update public.profiles set user_type = 'client'
    where id = '70000000-0000-0000-0000-000000000004'$$,
  'Only an administrator may change user_type, staff_role, or status',
  'user_type is guarded on the same footing'
);

-- A client changing its own row was already refused, and still is.
set local request.jwt.claims = '{"sub":"70000000-0000-0000-0000-000000000005","role":"authenticated"}';
select throws_ok(
  $$update public.profiles set user_type = 'staff'
    where id = '70000000-0000-0000-0000-000000000005'$$,
  'Only an administrator may change user_type, staff_role, or status',
  'a client cannot make itself staff'
);

-- The columns that confer no power are still the person's own to change.
set local request.jwt.claims = '{"sub":"70000000-0000-0000-0000-000000000004","role":"authenticated"}';
with changed as (
  update public.profiles set full_name = 'Renamed'
  where id = '70000000-0000-0000-0000-000000000004' returning 1
)
select is((select count(*)::int from changed), 1, 'but a name is still yours to change');

set local request.jwt.claims = '{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated"}';
select lives_ok(
  $$update public.profiles set staff_role = 'sales_admin'
    where id = '70000000-0000-0000-0000-000000000003'$$,
  'an administrator assigns a role'
);
select is(
  (select staff_role::text from public.profiles where id = '70000000-0000-0000-0000-000000000003'),
  'sales_admin',
  'and it takes effect'
);

-- ---------------------------------------------------------------------------
-- Customer records — everyone reads, operations writes
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"70000000-0000-0000-0000-000000000004","role":"authenticated"}';
select ok((select count(*) from public.clients) > 0, 'marketing still reads the customer list');
set local request.jwt.claims = '{"sub":"70000000-0000-0000-0000-000000000003","role":"authenticated"}';
select ok((select count(*) from public.clients) > 0, 'and so does a sales rep — reads did not narrow');

with changed as (update public.clients set trading_name = 'Hijacked' returning 1)
select is((select count(*)::int from changed), 0, 'but a sales rep cannot rewrite one');

set local request.jwt.claims = '{"sub":"70000000-0000-0000-0000-000000000004","role":"authenticated"}';
with changed as (update public.clients set trading_name = 'Hijacked' returning 1)
select is((select count(*)::int from changed), 0, 'and neither can marketing');

set local request.jwt.claims = '{"sub":"70000000-0000-0000-0000-000000000002","role":"authenticated"}';
with changed as (update public.clients set trading_name = 'Corrected' returning 1)
select is((select count(*)::int from changed), 1, 'operations corrects a customer record');
select is(
  (select trading_name from public.clients where id = '71000000-0000-0000-0000-000000000001'),
  'Corrected',
  'and the correction is the one that stuck'
);

-- What a specific client was sold is part of that client's record, even though
-- the catalogue it was assembled from is priced by sales admin.
set local request.jwt.claims = '{"sub":"70000000-0000-0000-0000-000000000003","role":"authenticated"}';
with changed as (update public.client_packages set name = name returning 1)
select is((select count(*)::int from changed), 0, 'a sales rep cannot change what a client was sold');

set local request.jwt.claims = '{"sub":"70000000-0000-0000-0000-000000000004","role":"authenticated"}';
with changed as (update public.compliance_document_types set active = active returning 1)
select is((select count(*)::int from changed), 0, 'marketing cannot change the compliance checklist');

set local request.jwt.claims = '{"sub":"70000000-0000-0000-0000-000000000002","role":"authenticated"}';
with changed as (update public.compliance_document_types set active = active returning 1)
select ok((select count(*) from changed) > 0, 'operations decides what a new client is asked for');

select * from finish();
rollback;
