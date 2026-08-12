begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

select has_function('public', 'current_staff_role', 'the role reader exists');
select has_function('public', 'has_staff_role', 'the role check exists');
select has_function('public', 'is_staff_admin', 'the admin shorthand exists');

-- One account per role, plus a client, so the checks are exercised by exactly
-- the callers they will face once policies move onto them.
insert into auth.users (id, email, raw_user_meta_data)
values
  ('40000000-0000-0000-0000-000000000001', 'role-admin@example.test',      '{"user_type":"staff","staff_role":"admin"}'),
  ('40000000-0000-0000-0000-000000000002', 'role-operations@example.test', '{"user_type":"staff","staff_role":"operations"}'),
  ('40000000-0000-0000-0000-000000000003', 'role-marketing@example.test',  '{"user_type":"staff","staff_role":"marketing"}'),
  ('40000000-0000-0000-0000-000000000004', 'role-client@example.test',     '{"user_type":"client"}');

set local role authenticated;

-- ---------------------------------------------------------------------------
-- Reading the role
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"40000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is(public.current_staff_role()::text, 'operations', 'a staff member reads their own role');

set local request.jwt.claims = '{"sub":"40000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is(public.current_staff_role(), null, 'a client has no staff role');

-- ---------------------------------------------------------------------------
-- The check
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"40000000-0000-0000-0000-000000000002","role":"authenticated"}';
select ok(public.has_staff_role('operations'), 'operations passes its own check');
select ok(
  public.has_staff_role('operations', 'sales_admin'),
  'and passes a check listing several roles'
);
select ok(not public.has_staff_role('marketing'), 'but not a role it does not hold');

-- Admin passing everything is the whole point: the alternative is naming admin
-- in every policy, where the first omission locks the administrator out.
set local request.jwt.claims = '{"sub":"40000000-0000-0000-0000-000000000001","role":"authenticated"}';
select ok(public.has_staff_role('operations'), 'admin passes a check it is not listed in');
select ok(public.has_staff_role('marketing'), 'admin passes every other role check too');
select ok(public.is_staff_admin(), 'and is recognised as admin');

set local request.jwt.claims = '{"sub":"40000000-0000-0000-0000-000000000003","role":"authenticated"}';
select ok(not public.is_staff_admin(), 'marketing is not admin');

-- ---------------------------------------------------------------------------
-- A non-staff caller
-- ---------------------------------------------------------------------------
--
-- False rather than null, because `false or null` is null in SQL: a null here
-- would poison any policy combining this with another condition, and
-- `not has_staff_role(...)` would match no rows at all.

set local request.jwt.claims = '{"sub":"40000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is(public.has_staff_role('admin'), false, 'a client is refused, and gets false not null');
select is(public.is_staff_admin(), false, 'and is not admin, also false not null');

-- ---------------------------------------------------------------------------
-- The migration off the blanket check
-- ---------------------------------------------------------------------------
--
-- This started as a tripwire proving the helper migration changed no access:
-- zero policies used the helpers, and the blanket check still covered
-- everything. The first tranche of surfaces has since moved, so the assertion
-- becomes the direction instead — the blanket count falls over time, never
-- rises, and the helpers keep gaining ground.

reset role;
select ok(
  (select count(*) from pg_policies
   where schemaname = 'public'
     and (qual like '%is_staff()%' or with_check like '%is_staff()%')) > 0,
  'surfaces not yet in a tranche are still on the blanket staff check'
);
select ok(
  (select count(*) from pg_policies
   where schemaname = 'public'
     and (qual like '%has_staff_role%' or with_check like '%has_staff_role%'
          or qual like '%is_staff_admin%' or with_check like '%is_staff_admin%')) > 0,
  'and the ones that have moved are gated on the role helpers'
);

select * from finish();
rollback;
