begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

-- Rows affected, never whether the statement raised: an UPDATE refused by RLS
-- affects zero rows and raises nothing at all.
--
-- The intake is staff-written and client-readable, and a partner never sees
-- it. That last line is the one this file mostly exists to hold: a Finance
-- partner learning a client's turnover band from the record, rather than from
-- a request the client chose to raise, would breach the anonymity rule.

insert into auth.users (id, email, raw_user_meta_data)
values
  ('c0000000-0000-0000-0000-000000000001', 'intake-client-a@example.test',   '{"user_type":"client"}'),
  ('c0000000-0000-0000-0000-000000000002', 'intake-client-b@example.test',   '{"user_type":"client"}'),
  ('c0000000-0000-0000-0000-000000000003', 'intake-operations@example.test', '{"user_type":"staff","staff_role":"operations"}'),
  ('c0000000-0000-0000-0000-000000000004', 'intake-partner@example.test',    '{"user_type":"service_provider"}');

insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values
  ('c1000000-0000-0000-0000-00000000000a', 'Intake Client A', 'Intake Client A (Pty) Ltd', 'Intake Client A',
   'c0000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-00000000000b', 'Intake Client B', 'Intake Client B (Pty) Ltd', 'Intake Client B',
   'c0000000-0000-0000-0000-000000000002');

insert into public.providers (id, profile_id, business_name)
values ('c2000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Intake Partner');

insert into public.service_groups (id, slug, name)
values
  ('c3000000-0000-0000-0000-000000000001', 'test-intake-finance', 'Test Intake Finance'),
  ('c3000000-0000-0000-0000-000000000002', 'test-intake-hr',      'Test Intake HR');

insert into public.client_work_group_intake (id, client_id, service_group_id, answers)
values
  ('c4000000-0000-0000-0000-00000000000a', 'c1000000-0000-0000-0000-00000000000a',
   'c3000000-0000-0000-0000-000000000001', '{"accounting_system":"xero","annual_turnover":"1m-5m"}'),
  ('c4000000-0000-0000-0000-00000000000b', 'c1000000-0000-0000-0000-00000000000b',
   'c3000000-0000-0000-0000-000000000001', '{"accounting_system":"sage"}');

-- ---------------------------------------------------------------------------
-- Constraints
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ insert into public.client_work_group_intake (client_id, service_group_id)
     values ('c1000000-0000-0000-0000-00000000000a', 'c3000000-0000-0000-0000-000000000001') $$,
  '23505',
  null,
  'one document per client and work group'
);

select throws_ok(
  $$ insert into public.client_work_group_intake (client_id, service_group_id, answers)
     values ('c1000000-0000-0000-0000-00000000000a', 'c3000000-0000-0000-0000-000000000002', '["loose"]') $$,
  '23514',
  null,
  'answers must be a JSON object'
);

-- ---------------------------------------------------------------------------
-- Staff capture and maintain it
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"c0000000-0000-0000-0000-000000000003","role":"authenticated"}';

select is(
  (select count(*) from public.client_work_group_intake),
  2::bigint,
  'operations staff read every client''s intake'
);

insert into public.client_work_group_intake (client_id, service_group_id, answers, captured_by)
values ('c1000000-0000-0000-0000-00000000000a', 'c3000000-0000-0000-0000-000000000002',
        '{"headcount":"6-20"}', 'c0000000-0000-0000-0000-000000000003');
select is(
  (select count(*) from public.client_work_group_intake
    where client_id = 'c1000000-0000-0000-0000-00000000000a'),
  2::bigint,
  'operations staff capture a new stage for a client'
);

with touched as (
  update public.client_work_group_intake
     set answers = answers || '{"bank":"FNB"}'
   where id = 'c4000000-0000-0000-0000-00000000000a'
  returning 1
)
select is((select count(*) from touched), 1::bigint, 'operations staff amend an answer set');

-- ---------------------------------------------------------------------------
-- The client reads its own, and only reads
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"c0000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select count(*) from public.client_work_group_intake),
  2::bigint,
  'a client sees the intake recorded about it, and nothing about another client'
);

select is(
  (select answers ->> 'bank' from public.client_work_group_intake
    where id = 'c4000000-0000-0000-0000-00000000000a'),
  'FNB',
  'and reads the answers themselves'
);

with touched as (
  update public.client_work_group_intake
     set answers = '{}'
   where id = 'c4000000-0000-0000-0000-00000000000a'
  returning 1
)
select is((select count(*) from touched), 0::bigint, 'a client cannot change what was recorded');

select throws_ok(
  $$ insert into public.client_work_group_intake (client_id, service_group_id)
     values ('c1000000-0000-0000-0000-00000000000a', 'c3000000-0000-0000-0000-000000000002') $$,
  '42501',
  null,
  'a client cannot write an intake document'
);

with removed as (
  delete from public.client_work_group_intake
   where id = 'c4000000-0000-0000-0000-00000000000a'
  returning 1
)
select is((select count(*) from removed), 0::bigint, 'a client cannot delete one either');

-- ---------------------------------------------------------------------------
-- A partner sees nothing
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"c0000000-0000-0000-0000-000000000004","role":"authenticated"}';

select is(
  (select count(*) from public.client_work_group_intake),
  0::bigint,
  'a partner reads no intake at all — the anonymity rule holds here'
);

with touched as (
  update public.client_work_group_intake
     set answers = '{}'
  returning 1
)
select is((select count(*) from touched), 0::bigint, 'and can change none of it');

select * from finish();
rollback;
