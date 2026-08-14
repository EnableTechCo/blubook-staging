begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('d0000000-0000-0000-0000-000000000001', 'qd-client@example.test', '{"user_type":"client"}'),
  ('d0000000-0000-0000-0000-000000000002', 'qd-admin@example.test',  '{"user_type":"staff","staff_role":"admin"}'),
  ('d0000000-0000-0000-0000-000000000003', 'qd-ops@example.test',    '{"user_type":"staff","staff_role":"operations"}');

insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values ('d1000000-0000-0000-0000-000000000001', 'QD Client', 'QD Client (Pty) Ltd', 'QD',
        'd0000000-0000-0000-0000-000000000001');

-- One of each: a quotation, and an ordinary document filed the usual way.
insert into public.documents (id, client_id, title, storage_path, mime_type, size_bytes, category)
values
  ('d2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
   'Quotation QUO-2026-000001', 'supabase://documents/quo.pdf', 'application/pdf', 2048, 'quotation'),
  ('d2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001',
   'Signed contract', 'supabase://documents/contract.pdf', 'application/pdf', 1024, 'other');

set local role authenticated;

-- ---------------------------------------------------------------------------
-- The client keeps both
-- ---------------------------------------------------------------------------

set local request.jwt.claims = '{"sub":"d0000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is((select count(*)::int from public.documents), 2, 'the client reads both its documents');

-- ---------------------------------------------------------------------------
-- Staff keep the archive, minus the quotations
-- ---------------------------------------------------------------------------
--
-- A quotation is printed on the letterhead, which carries the bank account.
-- Refusing staff the account in one table while serving it from another was the
-- hole this closes, so both staff roles are checked — admin because it passes
-- every other check in the system.

set local request.jwt.claims = '{"sub":"d0000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is((select count(*)::int from public.documents), 1, 'operations reads the archive');
select is(
  (select title from public.documents),
  'Signed contract',
  'and what it reads is not the quotation'
);

set local request.jwt.claims = '{"sub":"d0000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is((select count(*)::int from public.documents where category = 'quotation'), 0,
  'an administrator reads no quotation either');
select is((select count(*)::int from public.documents), 1, 'but still reads the rest of the archive');

-- A document staff cannot read is one they should not be able to retitle or
-- remove, or the protection is only against curiosity.
with changed as (
  update public.documents set title = 'Renamed'
  where id = 'd2000000-0000-0000-0000-000000000001' returning 1
)
select is((select count(*)::int from changed), 0, 'nor rename it');

with changed as (
  delete from public.documents where id = 'd2000000-0000-0000-0000-000000000001' returning 1
)
select is((select count(*)::int from changed), 0, 'nor delete it');

reset role;
select is(
  (select count(*)::int from public.documents where id = 'd2000000-0000-0000-0000-000000000001'),
  1,
  'and the quotation is still there afterwards'
);

select * from finish();
rollback;
