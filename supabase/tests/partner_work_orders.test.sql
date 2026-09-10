begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

-- The work order number is issued by the platform at the moment a partner
-- accepts, and belongs to that partner's job. Rows affected, never whether the
-- statement raised, except where the guard is meant to raise.

select has_sequence('public', 'partner_work_order_seq', 'the work order counter exists');
select has_function('public', 'stamp_partner_work_order', 'and the trigger function that draws from it');

insert into auth.users (id, email, raw_user_meta_data)
values
  ('d0000000-0000-0000-0000-000000000001', 'wo-client@example.test',     '{"user_type":"client"}'),
  ('d0000000-0000-0000-0000-000000000002', 'wo-partner-a@example.test',  '{"user_type":"service_provider"}'),
  ('d0000000-0000-0000-0000-000000000003', 'wo-partner-b@example.test',  '{"user_type":"service_provider"}'),
  ('d0000000-0000-0000-0000-000000000004', 'wo-operations@example.test', '{"user_type":"staff","staff_role":"operations"}');

insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values ('d1000000-0000-0000-0000-00000000000a', 'WO Client', 'WO Client (Pty) Ltd', 'WO Client',
        'd0000000-0000-0000-0000-000000000001');

insert into public.providers (id, profile_id, business_name, status)
values
  ('d2000000-0000-0000-0000-00000000000a', 'd0000000-0000-0000-0000-000000000002', 'Partner A', 'active'),
  ('d2000000-0000-0000-0000-00000000000b', 'd0000000-0000-0000-0000-000000000003', 'Partner B', 'active');

-- A service with no work group matches any capable partner, which keeps the
-- fixture to what this file is about.
insert into public.services (id, slug, name)
values ('d3000000-0000-0000-0000-000000000001', 'wo-test-service', 'WO Test Service');

insert into public.provider_capabilities (provider_id, service_id)
values
  ('d2000000-0000-0000-0000-00000000000a', 'd3000000-0000-0000-0000-000000000001'),
  ('d2000000-0000-0000-0000-00000000000b', 'd3000000-0000-0000-0000-000000000001');

insert into public.service_requests (id, reference, origin, client_id, service_id, title)
values ('d4000000-0000-0000-0000-000000000001', '', 'system',
        'd1000000-0000-0000-0000-00000000000a', 'd3000000-0000-0000-0000-000000000001', 'First job');

-- ---------------------------------------------------------------------------
-- Offered is not accepted
-- ---------------------------------------------------------------------------

select public.route_request('d4000000-0000-0000-0000-000000000001');

select is(
  (select status::text from public.service_requests where id = 'd4000000-0000-0000-0000-000000000001'),
  'open',
  'routing offers the request to a partner'
);
select is(
  (select partner_work_order_reference from public.service_requests where id = 'd4000000-0000-0000-0000-000000000001'),
  null,
  'and no work order is issued for an offer'
);

-- ---------------------------------------------------------------------------
-- Acceptance issues the number, in the house style
-- ---------------------------------------------------------------------------

select public.accept_assignment(
  (select id from public.request_assignments where request_id = 'd4000000-0000-0000-0000-000000000001')
);

select matches(
  (select partner_work_order_reference from public.service_requests where id = 'd4000000-0000-0000-0000-000000000001'),
  '^WO-[0-9]{6}$',
  'accepting issues WO-nnnnnn'
);

update public.service_requests set title = 'First job, retitled'
where id = 'd4000000-0000-0000-0000-000000000001';
select is(
  (select partner_work_order_reference from public.service_requests where id = 'd4000000-0000-0000-0000-000000000001'),
  (select 'WO-' || lpad(last_value::text, 6, '0') from public.partner_work_order_seq),
  'an unrelated update leaves the number alone'
);

-- ---------------------------------------------------------------------------
-- A different partner is a different job
-- ---------------------------------------------------------------------------

select is(
  (select provider_id from public.service_requests where id = 'd4000000-0000-0000-0000-000000000001'),
  'd2000000-0000-0000-0000-00000000000a'::uuid,
  'the least-loaded partner, A, holds the job'
);

-- The counter is not fresh here: seed data and the backfill drew from it
-- before this file ran. What matters is that this move costs exactly one.
create temporary table wo_before as
  select last_value as counter,
         (select partner_work_order_reference from public.service_requests
           where id = 'd4000000-0000-0000-0000-000000000001') as number
  from public.partner_work_order_seq;

update public.service_requests set provider_id = 'd2000000-0000-0000-0000-00000000000b'
where id = 'd4000000-0000-0000-0000-000000000001';
select isnt(
  (select partner_work_order_reference from public.service_requests where id = 'd4000000-0000-0000-0000-000000000001'),
  (select number from wo_before),
  'moving the request to partner B issues B a new number'
);
select is(
  (select last_value from public.partner_work_order_seq) - (select counter from wo_before),
  1::bigint,
  'and the counter has moved exactly once more'
);

-- ---------------------------------------------------------------------------
-- Who may write it
-- ---------------------------------------------------------------------------

set local role authenticated;

-- Partner B owns the request under RLS, so without the guard this would work.
set local request.jwt.claims = '{"sub":"d0000000-0000-0000-0000-000000000003","role":"authenticated"}';
select throws_ok(
  $$ update public.service_requests set partner_work_order_reference = 'MINE-1'
     where id = 'd4000000-0000-0000-0000-000000000001' $$,
  'Only staff may change assignment or request identity fields',
  'a partner cannot rewrite its work order number'
);

with touched as (
  update public.service_requests set status = 'in_progress'
   where id = 'd4000000-0000-0000-0000-000000000001'
  returning partner_work_order_reference
)
select matches(
  (select partner_work_order_reference from touched),
  '^WO-[0-9]{6}$',
  'but a partner still moves its own request along, number intact'
);

set local request.jwt.claims = '{"sub":"d0000000-0000-0000-0000-000000000004","role":"authenticated"}';
with touched as (
  update public.service_requests set partner_work_order_reference = 'OPS-OVERRIDE-1'
   where id = 'd4000000-0000-0000-0000-000000000001'
  returning partner_work_order_reference
)
select is((select partner_work_order_reference from touched), 'OPS-OVERRIDE-1', 'operations staff may overwrite it by hand');

select is(
  (select partner_work_order_reference from public.service_requests where id = 'd4000000-0000-0000-0000-000000000001'),
  'OPS-OVERRIDE-1',
  'and the trigger respects a value that is already set'
);

select * from finish();
rollback;
