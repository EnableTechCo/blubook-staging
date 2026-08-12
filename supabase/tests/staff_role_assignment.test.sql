begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('80000000-0000-0000-0000-000000000001', 'assign-admin@example.test',     '{"user_type":"staff","staff_role":"admin"}'),
  ('80000000-0000-0000-0000-000000000002', 'assign-admin-2@example.test',   '{"user_type":"staff","staff_role":"admin"}'),
  ('80000000-0000-0000-0000-000000000003', 'assign-marketing@example.test', '{"user_type":"staff","staff_role":"marketing"}'),
  ('80000000-0000-0000-0000-000000000004', 'assign-norole@example.test',    '{"user_type":"staff"}'),
  ('80000000-0000-0000-0000-000000000005', 'assign-client@example.test',    '{"user_type":"client"}');

-- Everything the product seeded before this test starts is out of the way, so
-- "the last administrator" means the ones created here.
update public.profiles set status = 'suspended'
where user_type = 'staff' and id::text not like '80000000%';

set local role authenticated;

-- ---------------------------------------------------------------------------
-- Who may assign
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"80000000-0000-0000-0000-000000000003","role":"authenticated"}';
select throws_ok(
  $$select public.set_staff_role('80000000-0000-0000-0000-000000000003', 'admin')$$,
  'Only an administrator may assign a staff role',
  'marketing cannot assign itself a role'
);
select throws_ok(
  $$select public.set_staff_role('80000000-0000-0000-0000-000000000004', 'operations')$$,
  'Only an administrator may assign a staff role',
  'nor assign one to somebody else'
);

set local request.jwt.claims = '{"sub":"80000000-0000-0000-0000-000000000001","role":"authenticated"}';
select lives_ok(
  $$select public.set_staff_role('80000000-0000-0000-0000-000000000004', 'operations')$$,
  'an administrator assigns a role'
);
select is(
  (select staff_role::text from public.profiles where id = '80000000-0000-0000-0000-000000000004'),
  'operations',
  'and it takes effect'
);

select lives_ok(
  $$select public.set_staff_role('80000000-0000-0000-0000-000000000004', 'sales_admin')$$,
  'and can change it again'
);
select is(
  (select staff_role::text from public.profiles where id = '80000000-0000-0000-0000-000000000004'),
  'sales_admin',
  'to the role that was asked for'
);

-- ---------------------------------------------------------------------------
-- What may be assigned, and to whom
-- ---------------------------------------------------------------------------
--
-- A staff role on a client would be silently meaningless: every check in the
-- system reads staff_role only after user_type = 'staff'.

select throws_ok(
  $$select public.set_staff_role('80000000-0000-0000-0000-000000000005', 'operations')$$,
  'Only a staff account can hold a staff role',
  'a client cannot be given a staff role'
);
select is(
  (select staff_role::text from public.profiles where id = '80000000-0000-0000-0000-000000000005'),
  null,
  'and the client is untouched'
);

select throws_ok(
  $$select public.set_staff_role('00000000-0000-0000-0000-0000000000ff', 'operations')$$,
  'No such account',
  'an account that does not exist is refused rather than silently ignored'
);

-- ---------------------------------------------------------------------------
-- The last administrator
-- ---------------------------------------------------------------------------
--
-- Only an administrator may assign a role, so an estate with none can never
-- gain one back through the product.

select lives_ok(
  $$select public.set_staff_role('80000000-0000-0000-0000-000000000002', 'operations')$$,
  'one of two administrators can be demoted'
);

select throws_ok(
  $$select public.set_staff_role('80000000-0000-0000-0000-000000000001', 'operations')$$,
  'This is the only administrator. Appoint another one before changing this account.',
  'but the last one cannot'
);
select is(
  (select staff_role::text from public.profiles where id = '80000000-0000-0000-0000-000000000001'),
  'admin',
  'and is still an administrator afterwards'
);

-- The protection is on the row, not on the function, so it holds for a direct
-- write too — which is exactly how it would happen by accident.
select throws_ok(
  $$update public.profiles set staff_role = 'marketing'
    where id = '80000000-0000-0000-0000-000000000001'$$,
  'This is the only administrator. Appoint another one before changing this account.',
  'including a direct update that bypasses the function'
);

select throws_ok(
  $$update public.profiles set status = 'suspended'
    where id = '80000000-0000-0000-0000-000000000001'$$,
  'This is the only administrator. Appoint another one before changing this account.',
  'and suspending the last administrator is the same thing'
);

select * from finish();
rollback;
