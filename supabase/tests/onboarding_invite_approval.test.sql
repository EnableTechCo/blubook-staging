begin;

create extension if not exists pgtap with schema extensions;

select plan(26);

-- The invariants of invite-and-approve onboarding: who may see and issue an
-- invitation, that a submitted client stays out of partner reach until it is
-- approved, and that approval does everything in one step or nothing. Rows
-- affected, never whether a statement raised, except where refusal is the
-- point.

select has_table('public', 'client_invitations', 'the invitations table exists');
select has_function('public', 'approve_client_onboarding', array['uuid'], 'the approval function exists');
select hasnt_table('public', 'onboarding_invites', 'the previous invite table is gone');
select hasnt_column('public', 'clients', 'finance_onboarding_complete', 'and the finance lock it added');

insert into auth.users (id, email, raw_user_meta_data)
values
  ('e0000000-0000-0000-0000-000000000001', 'inv-operations@example.test', '{"user_type":"staff","staff_role":"operations"}'),
  ('e0000000-0000-0000-0000-000000000002', 'inv-salesadmin@example.test', '{"user_type":"staff","staff_role":"sales_admin"}'),
  ('e0000000-0000-0000-0000-000000000003', 'inv-salesrep@example.test',   '{"user_type":"staff","staff_role":"sales_rep"}'),
  ('e0000000-0000-0000-0000-000000000004', 'inv-client@example.test',     '{"user_type":"client"}'),
  ('e0000000-0000-0000-0000-000000000005', 'inv-partner@example.test',    '{"user_type":"service_provider"}'),
  ('e0000000-0000-0000-0000-000000000006', 'inv-client-b@example.test',   '{"user_type":"client"}');

-- Two pending clients: one submitted for approval, one not.
insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values
  ('e1000000-0000-0000-0000-00000000000a', 'Invited Client', 'Invited Client (Pty) Ltd', 'Invited Client',
   'e0000000-0000-0000-0000-000000000004'),
  ('e1000000-0000-0000-0000-00000000000b', 'Unsubmitted Client', 'Unsubmitted Client (Pty) Ltd', 'Unsubmitted Client',
   'e0000000-0000-0000-0000-000000000006');

insert into public.providers (id, profile_id, business_name, status)
values ('e2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', 'Invite Partner', 'active');

insert into public.services (id, slug, name)
values ('e3000000-0000-0000-0000-000000000001', 'inv-test-service', 'Invite Test Service');

insert into public.provider_capabilities (provider_id, service_id)
values ('e2000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001');

insert into public.line_items (id, name, tier, price, service_id, fulfilment_mode)
values
  ('e4000000-0000-0000-0000-000000000001', 'Bookkeeping', 'basic', 100, 'e3000000-0000-0000-0000-000000000001', 'service_request'),
  ('e4000000-0000-0000-0000-000000000002', 'Portal access', 'basic', 50, 'e3000000-0000-0000-0000-000000000001', 'automatic');

insert into public.onboardings (id, client_id, status, submitted_at, requested_package)
values (
  'e5000000-0000-0000-0000-00000000000a', 'e1000000-0000-0000-0000-00000000000a', 'in_progress', now(),
  '{"basePackageId": null,
    "meta": {"type": "flex", "tier": null, "name": "Starter (Flex)", "total_price": 150, "billing_interval": null},
    "snapshots": [
      {"source_line_item_id": "e4000000-0000-0000-0000-000000000001", "name": "Bookkeeping", "tier": "basic",
       "unit_price": 100, "quantity": 1, "service_id": "e3000000-0000-0000-0000-000000000001", "fulfilment_mode": "service_request"},
      {"source_line_item_id": "e4000000-0000-0000-0000-000000000002", "name": "Portal access", "tier": "basic",
       "unit_price": 50, "quantity": 1, "service_id": "e3000000-0000-0000-0000-000000000001", "fulfilment_mode": "automatic"}
    ]}'::jsonb
);

insert into public.onboardings (id, client_id, status)
values ('e5000000-0000-0000-0000-00000000000b', 'e1000000-0000-0000-0000-00000000000b', 'in_progress');

-- ---------------------------------------------------------------------------
-- Invitations: shape
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ insert into public.client_invitations (email, token_hash)
     values ('Mixed@Case.test', repeat('a', 64)) $$,
  '23514', null,
  'an invitation email is stored lower-cased and trimmed'
);

select throws_ok(
  $$ insert into public.client_invitations (email, token_hash)
     values ('ok@example.test', 'not-a-digest') $$,
  '23514', null,
  'only a SHA-256 hex digest is accepted as the token'
);

select throws_ok(
  $$ insert into public.client_invitations (email, token_hash, accepted_at)
     values ('ok@example.test', repeat('b', 64), now()) $$,
  '23514', null,
  'an accepted invitation must name the client it created'
);

-- ---------------------------------------------------------------------------
-- Invitations: who may see and issue them
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"e0000000-0000-0000-0000-000000000001","role":"authenticated"}';

with issued as (
  insert into public.client_invitations (email, business_name, token_hash, invited_by)
  values ('new-client@example.test', 'New Client', repeat('c', 64), 'e0000000-0000-0000-0000-000000000001')
  returning 1
)
select is((select count(*) from issued), 1::bigint, 'operations staff issue an invitation in their own name');

select throws_ok(
  $$ insert into public.client_invitations (email, token_hash, invited_by)
     values ('forged@example.test', repeat('d', 64), 'e0000000-0000-0000-0000-000000000002') $$,
  '42501', null,
  'but not in someone else''s'
);

set local request.jwt.claims = '{"sub":"e0000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is((select count(*) from public.client_invitations), 1::bigint, 'sales admin see the invitation list');

set local request.jwt.claims = '{"sub":"e0000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is((select count(*) from public.client_invitations), 0::bigint, 'a sales rep does not');

set local request.jwt.claims = '{"sub":"e0000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is((select count(*) from public.client_invitations), 0::bigint, 'nor does a client');

set local request.jwt.claims = '{"sub":"e0000000-0000-0000-0000-000000000005","role":"authenticated"}';
select is((select count(*) from public.client_invitations), 0::bigint, 'nor a partner');

reset role;
set local role anon;
select throws_ok(
  $$ select count(*) from public.client_invitations $$,
  '42501', null,
  'an anonymous visitor cannot read the table at all'
);
reset role;

-- ---------------------------------------------------------------------------
-- A pending client is out of partner reach
-- ---------------------------------------------------------------------------

insert into public.service_requests (id, reference, origin, client_id, service_id, title)
values ('e6000000-0000-0000-0000-000000000001', '', 'client', 'e1000000-0000-0000-0000-00000000000a',
        'e3000000-0000-0000-0000-000000000001', 'Raised before approval');

select throws_ok(
  $$ select public.route_request('e6000000-0000-0000-0000-000000000001') $$,
  'P0001', 'Request e6000000-0000-0000-0000-000000000001 belongs to a client that is not active',
  'routing refuses a request from a client that has not been approved'
);

delete from public.service_requests where id = 'e6000000-0000-0000-0000-000000000001';

-- ---------------------------------------------------------------------------
-- Approval: who may approve
-- ---------------------------------------------------------------------------

set local role authenticated;

set local request.jwt.claims = '{"sub":"e0000000-0000-0000-0000-000000000003","role":"authenticated"}';
select throws_ok(
  $$ select public.approve_client_onboarding('e5000000-0000-0000-0000-00000000000a') $$,
  'P0001', 'Only operations or sales admin can approve a client',
  'a sales rep cannot approve'
);

set local request.jwt.claims = '{"sub":"e0000000-0000-0000-0000-000000000004","role":"authenticated"}';
select throws_ok(
  $$ select public.approve_client_onboarding('e5000000-0000-0000-0000-00000000000a') $$,
  'P0001', 'Only operations or sales admin can approve a client',
  'a client cannot approve itself'
);

set local request.jwt.claims = '{"sub":"e0000000-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok(
  $$ select public.approve_client_onboarding('e5000000-0000-0000-0000-00000000000b') $$,
  'P0001', 'This onboarding has not been submitted for approval',
  'a case that was never submitted cannot be approved'
);

-- ---------------------------------------------------------------------------
-- Approval: what it does, in one step
-- ---------------------------------------------------------------------------

select is(
  (public.approve_client_onboarding('e5000000-0000-0000-0000-00000000000a') ->> 'checklist_items')::integer,
  (select count(*)::integer from public.compliance_document_types where active),
  'operations approve, and the checklist has one item per active document type'
);

reset role;

select is(
  (select status::text from public.clients where id = 'e1000000-0000-0000-0000-00000000000a'),
  'active',
  'the client is live'
);

select is(
  (select count(*) from public.client_package_line_items cpli
     join public.client_packages cp on cp.id = cpli.client_package_id
    where cp.onboarding_id = 'e5000000-0000-0000-0000-00000000000a'),
  2::bigint,
  'the chosen package is snapshotted, every item'
);

select is(
  (select count(*) from public.service_requests where client_id = 'e1000000-0000-0000-0000-00000000000a'),
  1::bigint,
  'a request is raised only for the item a partner acts on'
);

select is(
  (select provider_id from public.service_requests where client_id = 'e1000000-0000-0000-0000-00000000000a'),
  'e2000000-0000-0000-0000-000000000001'::uuid,
  'and it is routed to the capable partner'
);

select is(
  (select created_by from public.service_requests where client_id = 'e1000000-0000-0000-0000-00000000000a'),
  'e0000000-0000-0000-0000-000000000001'::uuid,
  'with the approver recorded as its creator'
);

select isnt(
  (select approved_at from public.onboardings where id = 'e5000000-0000-0000-0000-00000000000a'),
  null,
  'the case records when it was approved'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"e0000000-0000-0000-0000-000000000002","role":"authenticated"}';
select throws_ok(
  $$ select public.approve_client_onboarding('e5000000-0000-0000-0000-00000000000a') $$,
  'P0001', 'This client has already been approved',
  'approving twice is refused, so nothing is raised twice'
);

select * from finish();
rollback;
