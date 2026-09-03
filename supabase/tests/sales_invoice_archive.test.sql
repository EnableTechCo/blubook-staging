begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

-- The profile trigger invokes seed_default_folders. Using a fresh client proves
-- that every new client gets the destination before a partner can return an
-- invoice for a sales order.
insert into auth.users (id, email, raw_user_meta_data)
values (
  'f0000000-0000-0000-0000-000000000001',
  'invoice-archive-client@example.test',
  '{"user_type":"client"}'
);

select ok(
  exists (
    select 1
    from public.document_categories invoices
    join public.document_categories sales on sales.id = invoices.parent_id
    where invoices.owner_profile_id = 'f0000000-0000-0000-0000-000000000001'
      and invoices.slug = 'invoices'
      and invoices.name = 'Invoices'
      and sales.slug = 'sales'
  ),
  'a new client receives Sales Articles → Invoices'
);

select is(
  (
    select invoices.sort_order
    from public.document_categories invoices
    where invoices.owner_profile_id = 'f0000000-0000-0000-0000-000000000001'
      and invoices.slug = 'invoices'
  ),
  18,
  'Invoices has a stable position in Sales Articles'
);

select has_function(
  'public',
  'complete_sales_order_with_invoice',
  array['uuid', 'text', 'jsonb'],
  'invoice completion function remains available'
);

select * from finish();

rollback;
