begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

select has_table('public', 'client_financials', 'financial submissions table exists');
select has_function('public', 'can_submit_client_financials', 'the submission gate exists');
select has_function('public', 'submit_client_financials', 'the submission entry point exists');
select has_column('public', 'service_groups', 'submits_financials',
  'a work group can carry the financial responsibility');

-- ---------------------------------------------------------------------------
-- Fixture: one client on a Finance package, one partner in that Finance group,
-- and one partner in a group that does not carry the responsibility.
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, raw_user_meta_data)
values
  ('30000000-0000-0000-0000-000000000001', 'fin-client@example.test',  '{"user_type":"client"}'),
  ('30000000-0000-0000-0000-000000000002', 'fin-partner@example.test', '{"user_type":"service_provider"}'),
  ('30000000-0000-0000-0000-000000000003', 'hr-partner@example.test',  '{"user_type":"service_provider"}');

insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values ('30000000-0000-0000-0000-00000000c001', 'Ridge Foods', 'Ridge Foods (Pty) Ltd', 'Ridge',
        '30000000-0000-0000-0000-000000000001');

insert into public.providers (id, profile_id, business_name)
values
  ('30000000-0000-0000-0000-00000000a001', '30000000-0000-0000-0000-000000000002', 'Finance Partner'),
  ('30000000-0000-0000-0000-00000000a002', '30000000-0000-0000-0000-000000000003', 'HR Partner');

insert into public.service_groups (id, slug, name, submits_financials)
values
  ('30000000-0000-0000-0000-00000000b001', 'test-fin', 'Test Finance', true),
  ('30000000-0000-0000-0000-00000000b002', 'test-hr',  'Test HR',      false);

insert into public.services (id, slug, name, group_id)
values ('30000000-0000-0000-0000-00000000d001', 'test-books', 'Bookkeeping',
        '30000000-0000-0000-0000-00000000b001');

insert into public.line_items (id, service_id, name, tier, price)
values ('30000000-0000-0000-0000-00000000e001', '30000000-0000-0000-0000-00000000d001',
        'Monthly bookkeeping', 'intermediate', 2450);

insert into public.client_packages (id, client_id, type, tier, name, total_price, status)
values ('30000000-0000-0000-0000-00000000f001', '30000000-0000-0000-0000-00000000c001',
        'standard', 'intermediate', 'Finance package', 2450, 'active');

insert into public.client_package_line_items
  (client_package_id, source_line_item_id, name, tier, unit_price, quantity)
values ('30000000-0000-0000-0000-00000000f001', '30000000-0000-0000-0000-00000000e001',
        'Monthly bookkeeping', 'intermediate', 2450, 1);

insert into public.work_group_members (work_group_id, provider_id)
values
  ('30000000-0000-0000-0000-00000000b001', '30000000-0000-0000-0000-00000000a001'),
  ('30000000-0000-0000-0000-00000000b002', '30000000-0000-0000-0000-00000000a002');

-- ---------------------------------------------------------------------------
-- The gate
-- ---------------------------------------------------------------------------

set local role authenticated;

set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated"}';
select ok(
  public.can_submit_client_financials('30000000-0000-0000-0000-00000000c001'),
  'a finance partner covering the client may submit'
);
select is(
  (select count(*)::int from public.financial_submission_clients),
  1,
  'and sees exactly that client in its submission list'
);

set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated"}';
select ok(
  not public.can_submit_client_financials('30000000-0000-0000-0000-00000000c001'),
  'a partner in a group without the responsibility may not'
);
select is(
  (select count(*)::int from public.financial_submission_clients),
  0,
  'and sees no clients to submit for'
);

set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}';
select ok(
  not public.can_submit_client_financials('30000000-0000-0000-0000-00000000c001'),
  'a client does not submit its own figures — the partner supplies them'
);

-- ---------------------------------------------------------------------------
-- Writing
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated"}';
select throws_ok(
  $$select public.submit_client_financials(
      '30000000-0000-0000-0000-00000000c001'::uuid, 2026::smallint, 2::smallint, 11::smallint,
      100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)$$,
  'You may not submit financial figures for this client',
  'the entry point refuses a partner without the responsibility'
);

set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated"}';
select lives_ok(
  $$select public.submit_client_financials(
      '30000000-0000-0000-0000-00000000c001'::uuid, 2026::smallint, 2::smallint, 11::smallint,
      100, 20, 5, 200, 30, 10, 5, 500, 250, 400, 800, 2, 40)$$,
  'the finance partner may record a week'
);

-- Re-submitting the same week corrects it rather than adding a second row.
select lives_ok(
  $$select public.submit_client_financials(
      '30000000-0000-0000-0000-00000000c001'::uuid, 2026::smallint, 2::smallint, 11::smallint,
      999, 20, 5, 200, 30, 10, 5, 500, 250, 400, 800, 2, 40)$$,
  'and may correct it'
);

reset role;
select is(
  (select count(*)::int from public.client_financials),
  1,
  'a correction replaces the week rather than doubling it'
);
select is(
  (select net_income from public.client_financials),
  999::numeric(16, 2),
  'and the corrected figure is the one kept'
);

-- ---------------------------------------------------------------------------
-- Reading
-- ---------------------------------------------------------------------------

set local role authenticated;

set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is(
  (select count(*)::int from public.client_financials),
  1,
  'the client reads its own figures'
);

-- The partner that supplied the figures has no table access: it writes through
-- the function and cannot read the stored history back.
set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is(
  (select count(*)::int from public.client_financials),
  0,
  'the submitting partner cannot read the table it writes through'
);

select * from finish();
rollback;
