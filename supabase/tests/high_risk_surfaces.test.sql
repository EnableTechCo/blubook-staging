begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

-- Every assertion below measures *rows*, never whether a statement raised.
-- An UPDATE the policy declines affects zero rows and raises nothing at all,
-- so "it ran" is not evidence that anything was permitted. This is the mistake
-- that hid a failed column revoke until the counts were checked directly.

insert into auth.users (id, email, raw_user_meta_data)
values
  ('50000000-0000-0000-0000-000000000001', 'hr-admin@example.test',      '{"user_type":"staff","staff_role":"admin"}'),
  ('50000000-0000-0000-0000-000000000002', 'hr-operations@example.test', '{"user_type":"staff","staff_role":"operations"}'),
  ('50000000-0000-0000-0000-000000000003', 'hr-salesadmin@example.test', '{"user_type":"staff","staff_role":"sales_admin"}'),
  ('50000000-0000-0000-0000-000000000004', 'hr-marketing@example.test',  '{"user_type":"staff","staff_role":"marketing"}'),
  ('50000000-0000-0000-0000-000000000005', 'hr-partner@example.test',    '{"user_type":"service_provider"}');

insert into public.clients (id, business_name, registered_name, trading_name)
values (
  '51000000-0000-0000-0000-000000000001',
  'Fixture Client', 'Fixture Client (Pty) Ltd', 'Fixture'
);

insert into public.onboardings (id, client_id, status)
values ('52000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', 'in_progress');

insert into public.providers (id, profile_id, business_name, tier)
values (
  '53000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000005',
  'Fixture Partner', 'standard'
);

-- Every set of figures has to cite the evidence it came from.
insert into public.documents (id, client_id, title, storage_path, mime_type, size_bytes, category)
values ('54000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001',
        'Management accounts', 'supabase://documents/hr-evidence.pdf', 'application/pdf', 1024, 'other');

insert into public.client_financials
  (client_id, fiscal_year, fiscal_quarter, fiscal_week, evidence_document_id, net_income)
values ('51000000-0000-0000-0000-000000000001', 2026, 2, 1,
        '54000000-0000-0000-0000-000000000001', 100000);

-- ---------------------------------------------------------------------------
-- Partner tiers — the column, not just the policy
-- ---------------------------------------------------------------------------
--
-- RLS is row-level, so no policy on providers can tell "staff editing a
-- partner" apart from "staff promoting one". The privilege has to come off the
-- column, and a table-wide UPDATE grant silently keeps covering every column —
-- which is exactly what went wrong the first time.

select is(
  (select count(*)::int from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'providers'
     and column_name = 'tier' and privilege_type = 'UPDATE'
     and grantee = 'authenticated'),
  0,
  'authenticated holds no UPDATE on providers.tier'
);

select ok(
  (select count(*) from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'providers'
     and column_name = 'business_name' and privilege_type = 'UPDATE'
     and grantee = 'authenticated') > 0,
  'and every other column is still writable, so nothing else narrowed'
);

set local role authenticated;

-- Admin included: nobody writes the column directly, admin goes via the function.
set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok(
  $$update public.providers set tier = 'premium'
    where id = '53000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'not even an admin may write the tier column directly'
);

select lives_ok(
  $$select public.set_provider_tier('53000000-0000-0000-0000-000000000001', 'premium')$$,
  'an admin promotes a partner through the function'
);
select is(
  (select tier::text from public.providers where id = '53000000-0000-0000-0000-000000000001'),
  'premium',
  'and the tier actually changed'
);

set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000002","role":"authenticated"}';
select throws_ok(
  $$select public.set_provider_tier('53000000-0000-0000-0000-000000000001', 'standard')$$,
  null,
  null,
  'operations is refused by the function'
);
select is(
  (select tier::text from public.providers where id = '53000000-0000-0000-0000-000000000001'),
  'premium',
  'and the refusal left the tier alone'
);

-- ---------------------------------------------------------------------------
-- Compliance settings — admin writes, everyone reads
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000001","role":"authenticated"}';
with changed as (
  update public.compliance_metric_settings set weight = weight returning 1
)
select ok((select count(*) from changed) > 0, 'an admin can write compliance settings');

set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000002","role":"authenticated"}';
with changed as (
  update public.compliance_metric_settings set weight = weight returning 1
)
select is((select count(*)::int from changed), 0, 'operations changes no compliance settings');

set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000004","role":"authenticated"}';
with changed as (
  update public.compliance_metric_settings set weight = weight returning 1
)
select is((select count(*)::int from changed), 0, 'and neither does marketing');

select ok(
  (select count(*) from public.compliance_metric_settings) > 0,
  'but marketing still reads them — a score is meaningless without its thresholds'
);

-- ---------------------------------------------------------------------------
-- Onboarding — operations writes, sales admin watches
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is((select count(*)::int from public.onboardings), 1, 'operations reads the onboarding queue');
with changed as (update public.onboardings set notes = notes returning 1)
select is((select count(*)::int from changed), 1, 'and can action it');

set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is((select count(*)::int from public.onboardings), 1, 'sales admin sees the queue');
with changed as (update public.onboardings set notes = notes returning 1)
select is((select count(*)::int from changed), 0, 'but cannot action it');

set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is((select count(*)::int from public.onboardings), 0, 'marketing does not see the queue at all');
with changed as (update public.onboardings set notes = notes returning 1)
select is((select count(*)::int from changed), 0, 'and cannot action it');

-- ---------------------------------------------------------------------------
-- Client financials — operations only
-- ---------------------------------------------------------------------------
--
-- These are the client's raw revenue, cost and debtor figures. Before this
-- tranche every staff login could read all of them.

set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is((select count(*)::int from public.client_financials), 1, 'operations reads client financials');

set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is((select count(*)::int from public.client_financials), 1, 'an admin does too');

set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is((select count(*)::int from public.client_financials), 0, 'sales admin does not');

set local request.jwt.claims = '{"sub":"50000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is((select count(*)::int from public.client_financials), 0, 'and neither does marketing');

reset role;

-- The tranche is only real if policies actually moved onto the helper.
select ok(
  (select count(*) from pg_policies
   where schemaname = 'public'
     and (qual like '%has_staff_role%' or with_check like '%has_staff_role%'
          or qual like '%is_staff_admin%' or with_check like '%is_staff_admin%')) >= 5,
  'the four surfaces are gated on the role helpers, not the blanket staff check'
);

select * from finish();
rollback;
