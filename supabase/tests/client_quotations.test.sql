begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('c0000000-0000-0000-0000-000000000001', 'quo-client-a@example.test', '{"user_type":"client"}'),
  ('c0000000-0000-0000-0000-000000000002', 'quo-client-b@example.test', '{"user_type":"client"}'),
  ('c0000000-0000-0000-0000-000000000003', 'quo-admin@example.test',    '{"user_type":"staff","staff_role":"admin"}');

insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values
  ('c1000000-0000-0000-0000-00000000000a', 'Quo A', 'Quo A (Pty) Ltd', 'Quo A',
   'c0000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-00000000000b', 'Quo B', 'Quo B (Pty) Ltd', 'Quo B',
   'c0000000-0000-0000-0000-000000000002');

-- ---------------------------------------------------------------------------
-- The reference and the expiry are the database's to decide
-- ---------------------------------------------------------------------------
--
-- Assigned by trigger rather than by the application so two quotations raised
-- in the same second cannot take the same number.

insert into public.quotations (client_id, recipient_name)
values ('c1000000-0000-0000-0000-00000000000a', 'A Customer');

select matches(
  (select reference from public.quotations),
  '^QUO-[0-9]{4}-[0-9]{6}$',
  'a quotation is given a reference in the house format'
);

select is(
  (select expires_at - issue_date from public.quotations),
  30,
  'and thirty days to accept it'
);

insert into public.quotations (client_id, recipient_name)
values ('c1000000-0000-0000-0000-00000000000a', 'Another Customer');
select is(
  (select count(distinct reference)::int from public.quotations),
  2,
  'two quotations never share a reference'
);

-- An expiry can be set explicitly, and then it is not moved.
insert into public.quotations (client_id, recipient_name, issue_date, expires_at)
values ('c1000000-0000-0000-0000-00000000000a', 'Third', '2026-08-01', '2026-08-08');
select is(
  (select expires_at from public.quotations where recipient_name = 'Third'),
  '2026-08-08'::date,
  'an expiry that was chosen is kept'
);

select throws_ok(
  $$insert into public.quotations (client_id, recipient_name, issue_date, expires_at)
    values ('c1000000-0000-0000-0000-00000000000a', 'Backwards', '2026-08-10', '2026-08-01')$$,
  '23514',
  null,
  'a quotation cannot expire before it was issued'
);

-- ---------------------------------------------------------------------------
-- Lines are copied, not referenced
-- ---------------------------------------------------------------------------

insert into public.quotation_items
  (quotation_id, product_code, description, quantity, unit_price, vat_rate, line_total)
select id, 'A-1', 'Blue widget', 2, 100, 15, 200
from public.quotations where recipient_name = 'A Customer';

select throws_ok(
  $$insert into public.quotation_items
      (quotation_id, product_code, description, quantity, unit_price, line_total)
    select id, 'A-2', 'Nothing', 0, 100, 0 from public.quotations limit 1$$,
  '23514',
  null,
  'a line for no quantity is refused'
);

-- The product list can change afterwards without touching what was quoted.
select is(
  (select count(*)::int from information_schema.table_constraints tc
   join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
   where tc.table_name = 'quotation_items' and tc.constraint_type = 'FOREIGN KEY'
     and ccu.table_name = 'client_products'),
  0,
  'a quoted line holds no reference to the product it came from'
);

-- ---------------------------------------------------------------------------
-- Whose quotation it is
-- ---------------------------------------------------------------------------

set local role authenticated;

set local request.jwt.claims = '{"sub":"c0000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is((select count(*)::int from public.quotations), 3, 'a client reads its own quotations');
select is((select count(*)::int from public.quotation_items), 1, 'and their lines');

set local request.jwt.claims = '{"sub":"c0000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is((select count(*)::int from public.quotations), 0, 'another client reads none of them');

-- A quotation carries the client's prices to a named customer, on a letterhead
-- showing the bank account. It follows the same rule as both.
set local request.jwt.claims = '{"sub":"c0000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is((select count(*)::int from public.quotations), 0, 'and an administrator reads none either');

select * from finish();
rollback;
