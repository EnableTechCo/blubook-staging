begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('a0000000-0000-0000-0000-000000000001', 'bank-client-a@example.test', '{"user_type":"client"}'),
  ('a0000000-0000-0000-0000-000000000002', 'bank-client-b@example.test', '{"user_type":"client"}'),
  ('a0000000-0000-0000-0000-000000000003', 'bank-admin@example.test',    '{"user_type":"staff","staff_role":"admin"}'),
  ('a0000000-0000-0000-0000-000000000004', 'bank-ops@example.test',      '{"user_type":"staff","staff_role":"operations"}'),
  ('a0000000-0000-0000-0000-000000000005', 'bank-partner@example.test',  '{"user_type":"service_provider"}');

insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values
  ('a1000000-0000-0000-0000-00000000000a', 'Bank Client A', 'Bank Client A (Pty) Ltd', 'A',
   'a0000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-00000000000b', 'Bank Client B', 'Bank Client B (Pty) Ltd', 'B',
   'a0000000-0000-0000-0000-000000000002');

insert into public.providers (id, profile_id, business_name)
values ('a2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'Bank Partner');

insert into public.client_banking_details
  (client_id, bank_name, account_name, account_number, branch_code)
values
  ('a1000000-0000-0000-0000-00000000000a', 'Standard Bank', 'Bank Client A', '000111222', '051001'),
  ('a1000000-0000-0000-0000-00000000000b', 'Absa',          'Bank Client B', '999888777', '632005');

-- ---------------------------------------------------------------------------
-- Client only means client only
-- ---------------------------------------------------------------------------
--
-- The guarantee is that nobody but the client reads these. Staff are checked
-- at both ends of the role range: an administrator passes every other check in
-- this system, so if the rule leaked anywhere it would leak there first.

set local role authenticated;

set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is((select count(*)::int from public.client_banking_details), 1, 'a client reads its own details');
select is(
  (select account_number from public.client_banking_details),
  '000111222',
  'and they are its own, not another client''s'
);

with changed as (update public.client_banking_details set bank_name = 'Nedbank' returning 1)
select is((select count(*)::int from changed), 1, 'a client maintains its own details');

set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is(
  (select account_number from public.client_banking_details),
  '999888777',
  'another client reads only its own'
);

set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is((select count(*)::int from public.client_banking_details), 0, 'operations reads none');
with changed as (update public.client_banking_details set bank_name = 'Seen' returning 1)
select is((select count(*)::int from changed), 0, 'and changes none');

set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is((select count(*)::int from public.client_banking_details), 0, 'an administrator reads none either');

set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000005","role":"authenticated"}';
select is((select count(*)::int from public.client_banking_details), 0, 'and a partner reads none');

-- The absence of a staff policy is the guarantee. A narrow staff policy could
-- be widened by an edit that looked harmless; none cannot.
reset role;
select is(
  (select count(*)::int from pg_policies where tablename = 'client_banking_details'),
  1,
  'exactly one policy exists on the table, and it is the client''s'
);

select * from finish();
rollback;
