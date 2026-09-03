begin;

create extension if not exists pgtap with schema extensions;

select plan(1);

insert into auth.users (id, email, raw_user_meta_data)
values ('f1000000-0000-0000-0000-000000000001', 'whole-quantity-client@example.test', '{"user_type":"client"}');

insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values (
  'f2000000-0000-0000-0000-000000000001',
  'Whole Quantity Client',
  'Whole Quantity Client (Pty) Ltd',
  'Whole Quantity Client',
  'f1000000-0000-0000-0000-000000000001'
);

insert into public.quotations (id, client_id, reference, recipient_name, expires_at)
values (
  'f3000000-0000-0000-0000-000000000001',
  'f2000000-0000-0000-0000-000000000001',
  'QUO-WHOLE-000001',
  'Test customer',
  '2026-10-01'
);

select throws_ok(
  $$insert into public.quotation_items
      (quotation_id, product_code, description, quantity, unit_price, vat_rate, line_total)
    values
      ('f3000000-0000-0000-0000-000000000001', 'UNIT-1', 'Whole item', 1.5, 100, 15, 150)$$,
  '23514',
  null,
  'quotation items reject fractional quantities'
);

select * from finish();

rollback;
