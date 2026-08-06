begin;

create extension if not exists pgtap with schema extensions;

select plan(30);

select has_table('public', 'opportunity_sources', 'opportunity source lookup exists');
select has_table('public', 'forecast_categories', 'forecast category lookup exists');
select has_table('public', 'sales_opportunities', 'sales opportunities table exists');
select has_table('public', 'sales_opportunity_events', 'opportunity event history exists');
select has_type('public', 'opportunity_payment_status', 'payment status enum exists');

select is(
  (select count(*) from public.opportunity_sources),
  2::bigint,
  'Team and Web sources are seeded'
);
select is(
  (select count(*) from public.forecast_categories),
  6::bigint,
  'all workbook forecast categories are seeded'
);

-- Auth identities provision profiles through the existing auth trigger.
insert into auth.users (id, email, raw_user_meta_data)
values
  ('10000000-0000-0000-0000-000000000001', 'client-one@example.test', '{"user_type":"client"}'),
  ('10000000-0000-0000-0000-000000000002', 'client-two@example.test', '{"user_type":"client"}'),
  ('10000000-0000-0000-0000-000000000003', 'provider@example.test', '{"user_type":"service_provider"}'),
  ('10000000-0000-0000-0000-000000000004', 'sales-staff@example.test', '{"user_type":"staff","staff_role":"sales_rep"}');

insert into public.clients (
  id, business_name, registered_name, trading_name, primary_profile_id, status
)
values
  ('20000000-0000-0000-0000-000000000001', 'Client One', 'Client One', 'Client One', '10000000-0000-0000-0000-000000000001', 'active'),
  ('20000000-0000-0000-0000-000000000002', 'Client Two', 'Client Two', 'Client Two', '10000000-0000-0000-0000-000000000002', 'active');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    insert into public.sales_opportunities (
      opportunity_source,
      opportunity_name,
      forecast_category,
      revenue,
      fiscal_year,
      fiscal_quarter,
      fiscal_week
    ) values ('team', 'Department of Education', 'commit', 100000, 2026, 4, 2)
  $$,
  'client can create an opportunity for its own account'
);

select matches(
  (select deal_reference from public.sales_opportunities where opportunity_name = 'Department of Education'),
  '^BLB-[0-9]{4}-[0-9]{6}$',
  'Deal ID uses the generated BLB-YYYY-NNNNNN format'
);

select is(
  (
    select count(*) from public.sales_opportunity_events
    where event_type = 'created' and actor_type = 'client'
  ),
  1::bigint,
  'creation is audited with the client actor type'
);

select ok(
  has_column_privilege('authenticated', 'public.sales_opportunities', 'revenue', 'UPDATE'),
  'authenticated clients receive business-field update privilege'
);
select ok(
  not has_column_privilege('authenticated', 'public.sales_opportunities', 'deal_reference', 'UPDATE'),
  'Deal ID is not directly updateable'
);
select ok(
  not has_column_privilege('authenticated', 'public.sales_opportunities', 'invoice_number', 'UPDATE'),
  'invoice number is not directly updateable'
);
select ok(
  not has_column_privilege('authenticated', 'public.sales_opportunities', 'payment_status', 'UPDATE'),
  'payment status is not directly updateable'
);

select lives_ok(
  $$
    update public.sales_opportunities
    set revenue = 125000, forecast_category = 'upside'
    where opportunity_name = 'Department of Education'
  $$,
  'client can update its permitted business fields'
);

select is(
  (select count(*) from public.sales_opportunity_events where event_type = 'updated'),
  1::bigint,
  'business-field update is audited'
);
select is(
  (select count(*) from public.sales_opportunity_events where event_type = 'category_changed'),
  1::bigint,
  'category change is audited separately'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select is(
  (select count(*) from public.sales_opportunities),
  0::bigint,
  'another client cannot see the first client opportunity'
);

select throws_ok(
  $$
    insert into public.sales_opportunities (
      client_id, opportunity_source, opportunity_name, forecast_category, revenue
    ) values (
      '20000000-0000-0000-0000-000000000001', 'web', 'Cross-client attempt', 'open', 0
    )
  $$,
  'P0001',
  'Cannot create an opportunity for another client',
  'client cannot create an opportunity for another account'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select is(
  (select count(*) from public.sales_opportunities),
  0::bigint,
  'external provider cannot browse opportunities'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select is(
  (select count(*) from public.sales_opportunities),
  0::bigint,
  'internal sales staff cannot browse opportunities'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select throws_like(
  $$
    insert into public.sales_opportunities (
      opportunity_source, opportunity_name, forecast_category, revenue, fiscal_week
    ) values ('web', 'Invalid period', 'open', 0, 3)
  $$,
  '%sales_opportunities_fiscal_hierarchy%',
  'database rejects a fiscal week without year and quarter'
);

select throws_ok(
  $$
    insert into public.sales_opportunities (
      deal_reference, opportunity_source, opportunity_name, forecast_category, revenue
    ) values ('CUSTOM-1', 'web', 'Custom Deal ID', 'open', 0)
  $$,
  'P0001',
  'Deal ID is generated by the system',
  'client cannot choose a custom Deal ID'
);

reset role;
update public.opportunity_sources set active = false where code = 'web';
update public.forecast_categories set active = false where code = 'best_case';
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$
    update public.sales_opportunities
    set opportunity_source = 'web'
    where opportunity_name = 'Department of Education'
  $$,
  'P0001',
  'Choose an active opportunity source',
  'client cannot select an inactive opportunity source'
);

select throws_ok(
  $$
    update public.sales_opportunities
    set forecast_category = 'best_case'
    where opportunity_name = 'Department of Education'
  $$,
  'P0001',
  'Choose an active forecast category',
  'client cannot select an inactive forecast category'
);

reset role;
update public.opportunity_sources set active = true where code = 'web';
update public.forecast_categories set active = true where code = 'best_case';
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.sales_opportunities (
  opportunity_source, opportunity_name, forecast_category, revenue
) values ('web', 'Disposable lead', 'open', 0);

select results_eq(
  $$
    with deleted as (
      delete from public.sales_opportunities
      where opportunity_name = 'Disposable lead'
      returning id
    )
    select count(*) from deleted
  $$,
  $$ values (1::bigint) $$,
  'client can delete a pre-booking opportunity'
);

select is(
  (
    select count(*) from public.sales_opportunity_events
    where event_type = 'deleted'
      and deal_reference like 'BLB-%'
      and opportunity_id is null
  ),
  1::bigint,
  'delete audit survives after the opportunity row is removed'
);

reset role;
update public.sales_opportunities
set booked_at = now(), payment_status = 'unpaid', forecast_category = 'booked'
where opportunity_name = 'Department of Education';

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select results_eq(
  $$
    with deleted as (
      delete from public.sales_opportunities
      where opportunity_name = 'Department of Education'
      returning id
    )
    select count(*) from deleted
  $$,
  $$ values (0::bigint) $$,
  'client cannot delete a booked opportunity'
);

select is(
  (select count(*) from public.sales_opportunities where opportunity_name = 'Department of Education'),
  1::bigint,
  'booked opportunity remains stored after delete attempt'
);

select ok(
  not has_table_privilege('authenticated', 'public.sales_opportunity_events', 'INSERT'),
  'clients cannot write audit events directly'
);

select * from finish();
rollback;
