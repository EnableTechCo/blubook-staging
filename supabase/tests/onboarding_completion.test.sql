begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into public.clients (id, business_name, status)
values ('81000000-0000-0000-0000-000000000001', 'Onboarding Completion Test', 'active');

insert into public.compliance_document_types (id, slug, name)
values
  ('81000000-0000-0000-0000-000000000011', 'completion-test-one', 'Completion test one'),
  ('81000000-0000-0000-0000-000000000012', 'completion-test-two', 'Completion test two');

insert into public.onboardings (id, client_id, status, completed_at)
values (
  '81000000-0000-0000-0000-000000000021',
  '81000000-0000-0000-0000-000000000001',
  'completed',
  now()
);

insert into public.onboarding_documents (id, onboarding_id, document_type_id)
values
  (
    '81000000-0000-0000-0000-000000000031',
    '81000000-0000-0000-0000-000000000021',
    '81000000-0000-0000-0000-000000000011'
  ),
  (
    '81000000-0000-0000-0000-000000000032',
    '81000000-0000-0000-0000-000000000021',
    '81000000-0000-0000-0000-000000000012'
  );

select is(
  (select status::text from public.onboardings where id = '81000000-0000-0000-0000-000000000021'),
  'awaiting_documents',
  'an onboarding with outstanding documents is not completed'
);
select is(
  (select completed_at from public.onboardings where id = '81000000-0000-0000-0000-000000000021'),
  null,
  'an open onboarding has no completion timestamp'
);

update public.onboarding_documents
set status = 'verified'
where id = '81000000-0000-0000-0000-000000000031';

select is(
  (select status::text from public.onboardings where id = '81000000-0000-0000-0000-000000000021'),
  'awaiting_documents',
  'verifying only some required documents keeps onboarding open'
);

update public.onboarding_documents
set status = 'rejected'
where id = '81000000-0000-0000-0000-000000000032';

select is(
  (select status::text from public.onboardings where id = '81000000-0000-0000-0000-000000000021'),
  'awaiting_documents',
  'a rejected document keeps onboarding open'
);

update public.onboarding_documents
set status = 'verified'
where id = '81000000-0000-0000-0000-000000000032';

select is(
  (select status::text from public.onboardings where id = '81000000-0000-0000-0000-000000000021'),
  'completed',
  'the final verified document completes onboarding'
);
select isnt(
  (select completed_at from public.onboardings where id = '81000000-0000-0000-0000-000000000021'),
  null,
  'completion stamps the onboarding time'
);

update public.onboarding_documents
set status = 'received'
where id = '81000000-0000-0000-0000-000000000031';

select is(
  (select status::text from public.onboardings where id = '81000000-0000-0000-0000-000000000021'),
  'awaiting_documents',
  'a document requiring another review reopens onboarding'
);
select is(
  (select completed_at from public.onboardings where id = '81000000-0000-0000-0000-000000000021'),
  null,
  'reopened onboarding clears its completion timestamp'
);

select * from finish();
rollback;
