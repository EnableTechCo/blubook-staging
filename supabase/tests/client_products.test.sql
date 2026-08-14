begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

-- Rows affected, never whether the statement raised: an UPDATE refused by RLS
-- affects zero rows and raises nothing at all.

insert into auth.users (id, email, raw_user_meta_data)
values
  ('90000000-0000-0000-0000-000000000001', 'prod-client-a@example.test',  '{"user_type":"client"}'),
  ('90000000-0000-0000-0000-000000000002', 'prod-client-b@example.test',  '{"user_type":"client"}'),
  ('90000000-0000-0000-0000-000000000003', 'prod-operations@example.test','{"user_type":"staff","staff_role":"operations"}'),
  ('90000000-0000-0000-0000-000000000004', 'prod-marketing@example.test', '{"user_type":"staff","staff_role":"marketing"}'),
  ('90000000-0000-0000-0000-000000000005', 'prod-partner@example.test',   '{"user_type":"service_provider"}');

insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values
  ('91000000-0000-0000-0000-00000000000a', 'Client A', 'Client A (Pty) Ltd', 'Client A',
   '90000000-0000-0000-0000-000000000001'),
  ('91000000-0000-0000-0000-00000000000b', 'Client B', 'Client B (Pty) Ltd', 'Client B',
   '90000000-0000-0000-0000-000000000002');

insert into public.providers (id, profile_id, business_name)
values ('92000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000005', 'Prod Partner');

insert into public.client_products (client_id, product_code, description, unit_price, vat_rate)
values
  ('91000000-0000-0000-0000-00000000000a', 'A-1', 'Client A widget', 100, 15),
  ('91000000-0000-0000-0000-00000000000b', 'B-1', 'Client B widget', 200, 15);

set local role authenticated;

-- ---------------------------------------------------------------------------
-- A client's list is its own
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"90000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is((select count(*)::int from public.client_products), 1, 'a client sees only its own products');
select is(
  (select product_code from public.client_products),
  'A-1',
  'and it is the right one'
);

with changed as (update public.client_products set unit_price = 150 returning 1)
select is((select count(*)::int from changed), 1, 'a client prices its own product');

-- The reachable row is the only one it can touch, so this is a no-op rather
-- than a rewrite of the other client's price.
with changed as (
  update public.client_products set unit_price = 1
  where client_id = '91000000-0000-0000-0000-00000000000b' returning 1
)
select is((select count(*)::int from changed), 0, 'and cannot price another client''s');
-- Checked with the policies off, because client A cannot read that row at all
-- — which is the stronger fact, and also why asking client A whether the price
-- survived would answer NULL either way.
reset role;
select is(
  (select unit_price from public.client_products
   where client_id = '91000000-0000-0000-0000-00000000000b'),
  200::numeric,
  'the other client''s price is untouched'
);
set local role authenticated;

-- A client cannot file a product against somebody else either.
select throws_ok(
  $$insert into public.client_products (client_id, product_code, description, unit_price)
    values ('91000000-0000-0000-0000-00000000000b', 'A-X', 'Smuggled', 1)$$,
  '42501',
  null,
  'nor add one to another client''s list'
);

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------
--
-- The product list is part of the client's record, so it follows that record's
-- rule: every staff role reads, operations writes. Operations needs the write
-- because operations uploads the first list during onboarding.

set local request.jwt.claims = '{"sub":"90000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is((select count(*)::int from public.client_products), 2, 'marketing reads every list');
with changed as (update public.client_products set unit_price = 5 returning 1)
select is((select count(*)::int from changed), 0, 'but changes no price');

set local request.jwt.claims = '{"sub":"90000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is((select count(*)::int from public.client_products), 2, 'operations reads every list');
with changed as (update public.client_products set category = 'Reviewed' returning 1)
select is((select count(*)::int from changed), 2, 'and may correct one');

-- ---------------------------------------------------------------------------
-- Partners
-- ---------------------------------------------------------------------------
--
-- A partner has no business knowing what a client sells, and quotations never
-- reach one. There is no partner policy at all, so this is zero by absence
-- rather than by a rule that could be loosened by accident.

set local request.jwt.claims = '{"sub":"90000000-0000-0000-0000-000000000005","role":"authenticated"}';
select is((select count(*)::int from public.client_products), 0, 'a partner sees no product list');

-- ---------------------------------------------------------------------------
-- The list is not the catalogue
-- ---------------------------------------------------------------------------
--
-- line_items is what BluBook sells, priced by sales admin. Holding client
-- products in that table would have put a staff role in charge of a client's
-- prices, so the separation is asserted rather than assumed.

reset role;
select is(
  (select count(*)::int from public.line_items li
   join public.client_products cp on cp.product_code = li.name),
  0,
  'client products and the BluBook catalogue share no rows'
);

select * from finish();
rollback;
