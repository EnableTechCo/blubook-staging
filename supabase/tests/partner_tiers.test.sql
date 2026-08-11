begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

select has_type('public', 'provider_tier', 'partner tier enum exists');
select has_column('public', 'providers', 'tier', 'providers carry a tier');
select has_function('public', 'can_see_client_identity', 'the identity gate exists');

select col_default_is('public', 'providers', 'tier', 'standard',
  'a partner is standard unless staff promote it');

-- ---------------------------------------------------------------------------
-- Fixture: one client whose package is delivered by the Finance group, and
-- three partners — one premium inside Finance, one standard inside Finance, and
-- one premium inside an unrelated group.
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, raw_user_meta_data)
values
  ('20000000-0000-0000-0000-000000000001', 'tier-client@example.test',   '{"user_type":"client"}'),
  ('20000000-0000-0000-0000-000000000002', 'tier-premium@example.test',  '{"user_type":"service_provider"}'),
  ('20000000-0000-0000-0000-000000000003', 'tier-standard@example.test', '{"user_type":"service_provider"}'),
  ('20000000-0000-0000-0000-000000000004', 'tier-other@example.test',    '{"user_type":"service_provider"}');

insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values (
  '20000000-0000-0000-0000-00000000c001',
  'Maboneng Trading', 'Maboneng Trading (Pty) Ltd', 'Maboneng',
  '20000000-0000-0000-0000-000000000001'
);

insert into public.providers (id, profile_id, business_name, tier)
values
  ('20000000-0000-0000-0000-00000000a001', '20000000-0000-0000-0000-000000000002', 'Premium Finance Partner',  'premium'),
  ('20000000-0000-0000-0000-00000000a002', '20000000-0000-0000-0000-000000000003', 'Standard Finance Partner', 'standard'),
  ('20000000-0000-0000-0000-00000000a003', '20000000-0000-0000-0000-000000000004', 'Premium Logistics Partner','premium');

insert into public.service_groups (id, slug, name)
values
  ('20000000-0000-0000-0000-00000000b001', 'test-finance',   'Test Finance'),
  ('20000000-0000-0000-0000-00000000b002', 'test-logistics', 'Test Logistics');

insert into public.services (id, slug, name, group_id)
values ('20000000-0000-0000-0000-00000000d001', 'test-bookkeeping', 'Bookkeeping',
        '20000000-0000-0000-0000-00000000b001');

insert into public.line_items (id, service_id, name, tier, price)
values ('20000000-0000-0000-0000-00000000e001', '20000000-0000-0000-0000-00000000d001',
        'Monthly bookkeeping', 'intermediate', 2450);

-- A standard package must name a tier; a flex package must not.
insert into public.client_packages (id, client_id, type, tier, name, total_price, status)
values ('20000000-0000-0000-0000-00000000f001', '20000000-0000-0000-0000-00000000c001',
        'standard', 'intermediate', 'Operations support', 2450, 'active');

insert into public.client_package_line_items
  (client_package_id, source_line_item_id, name, tier, unit_price, quantity)
values ('20000000-0000-0000-0000-00000000f001', '20000000-0000-0000-0000-00000000e001',
        'Monthly bookkeeping', 'intermediate', 2450, 1);

-- The premium and the standard partner both deliver Finance work; the third
-- premium partner sits in a group that does not cover this client.
insert into public.work_group_members (work_group_id, provider_id)
values
  ('20000000-0000-0000-0000-00000000b001', '20000000-0000-0000-0000-00000000a001'),
  ('20000000-0000-0000-0000-00000000b001', '20000000-0000-0000-0000-00000000a002'),
  ('20000000-0000-0000-0000-00000000b002', '20000000-0000-0000-0000-00000000a003');

-- ---------------------------------------------------------------------------
-- The gate itself
-- ---------------------------------------------------------------------------

set local role authenticated;

set local request.jwt.claims = '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}';
select ok(
  public.can_see_client_identity('20000000-0000-0000-0000-00000000c001'),
  'a premium partner covering the client may see its identity'
);
select is(
  (select business_name from public.client_references where id = '20000000-0000-0000-0000-00000000c001'),
  'Maboneng Trading',
  'and the view fills the business name in'
);
select isnt(
  (select external_reference from public.client_references where id = '20000000-0000-0000-0000-00000000c001'),
  null,
  'the Customer ID is still present alongside it'
);

set local request.jwt.claims = '{"sub":"20000000-0000-0000-0000-000000000003","role":"authenticated"}';
select ok(
  not public.can_see_client_identity('20000000-0000-0000-0000-00000000c001'),
  'a standard partner in the same group may not'
);
select is(
  (select business_name from public.client_references where id = '20000000-0000-0000-0000-00000000c001'),
  null,
  'the view withholds the name from a standard partner'
);

set local request.jwt.claims = '{"sub":"20000000-0000-0000-0000-000000000004","role":"authenticated"}';
select ok(
  not public.can_see_client_identity('20000000-0000-0000-0000-00000000c001'),
  'premium does not reach across into a group that does not cover the client'
);

set local request.jwt.claims = '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated"}';
select ok(
  public.can_see_client_identity('20000000-0000-0000-0000-00000000c001'),
  'a client always sees its own identity'
);

-- ---------------------------------------------------------------------------
-- Contact details are absent by construction, not merely filtered. If someone
-- adds them to the view later, these fail rather than leaking silently.
-- ---------------------------------------------------------------------------

reset role;

select hasnt_column('public', 'client_references', 'primary_contact_phone',
  'the reference view exposes no contact phone');
select hasnt_column('public', 'client_references', 'billing_contact_email',
  'the reference view exposes no billing email');
select hasnt_column('public', 'client_references', 'business_address_line_1',
  'the reference view exposes no address');
select hasnt_column('public', 'client_references', 'vat_number',
  'the reference view exposes no VAT number');

-- ---------------------------------------------------------------------------
-- Entitlement follows the package, so it ends when the package does.
-- ---------------------------------------------------------------------------

update public.client_packages set status = 'cancelled'
where id = '20000000-0000-0000-0000-00000000f001';

set local role authenticated;
set local request.jwt.claims = '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}';
select ok(
  not public.can_see_client_identity('20000000-0000-0000-0000-00000000c001'),
  'a lapsed package withdraws the premium partner''s entitlement'
);

-- Demoting a premium partner takes effect immediately: the entitlement is
-- evaluated per query, never copied onto a row.
reset role;
update public.client_packages set status = 'active'
where id = '20000000-0000-0000-0000-00000000f001';
update public.providers set tier = 'standard'
where id = '20000000-0000-0000-0000-00000000a001';

set local role authenticated;
set local request.jwt.claims = '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}';
select ok(
  not public.can_see_client_identity('20000000-0000-0000-0000-00000000c001'),
  'demoting to standard withdraws the identity at once'
);
select is(
  (select business_name from public.client_references where id = '20000000-0000-0000-0000-00000000c001'),
  null,
  'and the view stops filling the name in'
);

select * from finish();
rollback;
