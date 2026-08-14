begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email, raw_user_meta_data)
values ('e0000000-0000-0000-0000-000000000001', 'qo-client@example.test', '{"user_type":"client"}');

insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values ('e1000000-0000-0000-0000-000000000001', 'QO Client', 'QO (Pty) Ltd', 'QO',
        'e0000000-0000-0000-0000-000000000001');

insert into public.sales_opportunities (id, client_id, opportunity_source, opportunity_name, revenue)
values ('e2000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001',
        (select code from public.opportunity_sources limit 1), 'Quoted deal', 5000);

insert into public.quotations (id, client_id, recipient_name, opportunity_id)
values ('e3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001',
        'A Customer', 'e2000000-0000-0000-0000-000000000001');

select is(
  (select opportunity_id from public.quotations where id = 'e3000000-0000-0000-0000-000000000001'),
  'e2000000-0000-0000-0000-000000000001'::uuid,
  'a quotation can carry the opportunity it raised'
);

-- Most quotations do not belong in a forecast, so the link has to be optional.
insert into public.quotations (id, client_id, recipient_name)
values ('e3000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Walk-in');
select is(
  (select opportunity_id from public.quotations where id = 'e3000000-0000-0000-0000-000000000002'),
  null,
  'and a generic quotation carries none'
);

-- Two quotations on one opportunity would make the forecast figure whichever
-- was written last, silently.
select throws_ok(
  $$insert into public.quotations (client_id, recipient_name, opportunity_id)
    values ('e1000000-0000-0000-0000-000000000001', 'Second',
            'e2000000-0000-0000-0000-000000000001')$$,
  '23505',
  null,
  'one opportunity cannot be claimed by two quotations'
);

-- But any number of quotations may be unlinked, so the uniqueness must be
-- partial rather than a plain unique column.
select lives_ok(
  $$insert into public.quotations (client_id, recipient_name)
    values ('e1000000-0000-0000-0000-000000000001', 'Another walk-in')$$,
  'while any number may sit outside the pipeline'
);

-- An opportunity can be deleted before it is booked. Losing the quotation with
-- it would destroy the record of what was actually sent to a customer.
delete from public.sales_opportunities where id = 'e2000000-0000-0000-0000-000000000001';

select is(
  (select count(*)::int from public.quotations where id = 'e3000000-0000-0000-0000-000000000001'),
  1,
  'deleting the opportunity leaves the quotation standing'
);
select is(
  (select opportunity_id from public.quotations where id = 'e3000000-0000-0000-0000-000000000001'),
  null,
  'and only unlinks it'
);

-- The opportunity is the client's own, so the quotation and the opportunity
-- agree about whose they are.
select is(
  (select count(*)::int from public.quotations q
   join public.clients c on c.id = q.client_id
   where c.primary_profile_id = 'e0000000-0000-0000-0000-000000000001'),
  -- Three, not four: the duplicate-link insert above was refused, and a
  -- refused statement leaves nothing behind.
  3,
  'every quotation raised here belongs to the one client'
);

select * from finish();
rollback;
