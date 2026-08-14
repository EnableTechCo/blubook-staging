begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('b0000000-0000-0000-0000-000000000001', 'lh-client@example.test',  '{"user_type":"client"}'),
  ('b0000000-0000-0000-0000-000000000002', 'lh-admin@example.test',   '{"user_type":"staff","staff_role":"admin"}'),
  ('b0000000-0000-0000-0000-000000000003', 'lh-partner@example.test', '{"user_type":"service_provider"}');

insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values ('b1000000-0000-0000-0000-000000000001', 'LH Client', 'LH Client (Pty) Ltd', 'LH',
        'b0000000-0000-0000-0000-000000000001');

insert into public.providers (id, profile_id, business_name)
values ('b2000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'LH Partner');

insert into public.client_letterheads (client_id, footer_note)
values ('b1000000-0000-0000-0000-000000000001', 'Valid for 30 days');

set local role authenticated;

set local request.jwt.claims = '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is((select count(*)::int from public.client_letterheads), 1, 'a client reads its own letterhead');
with changed as (update public.client_letterheads set show_banking = false returning 1)
select is((select count(*)::int from changed), 1, 'and sets what it shows');

-- A letterhead carries the bank account, so any reader of the letterhead is a
-- reader of the account. It follows the same rule as the account itself.
set local request.jwt.claims = '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is((select count(*)::int from public.client_letterheads), 0, 'an administrator reads none');

set local request.jwt.claims = '{"sub":"b0000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is((select count(*)::int from public.client_letterheads), 0, 'and a partner reads none');

reset role;
select is(
  (select count(*)::int from pg_policies where tablename = 'client_letterheads'),
  1,
  'exactly one policy exists, and it is the client''s'
);

-- The letterhead holds choices, not a copy of the details. If it ever grew a
-- column holding an address or an account number, a letterhead would start
-- going stale silently the first time the client's record changed.
select is(
  (select count(*)::int from information_schema.columns
   where table_schema = 'public' and table_name = 'client_letterheads'
     and column_name in ('bank_name', 'account_number', 'address', 'registered_name',
                         'trading_name', 'vat_number', 'registration_number')),
  0,
  'the letterhead snapshots none of the details it displays'
);

select * from finish();
rollback;
