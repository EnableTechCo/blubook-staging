begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

-- Rows affected, never whether the statement raised: an UPDATE refused by RLS
-- affects zero rows and raises nothing at all.
--
-- The board is private in a way the product list is not. A staff role reads
-- every client's products because the list is part of the client's record; no
-- staff role reads a task, because a task is the client's own working memory.
-- That difference is what most of this file exists to hold in place.

insert into auth.users (id, email, raw_user_meta_data)
values
  ('a0000000-0000-0000-0000-000000000001', 'task-client-a@example.test',  '{"user_type":"client"}'),
  ('a0000000-0000-0000-0000-000000000002', 'task-client-b@example.test',  '{"user_type":"client"}'),
  ('a0000000-0000-0000-0000-000000000003', 'task-operations@example.test','{"user_type":"staff","staff_role":"operations"}'),
  ('a0000000-0000-0000-0000-000000000004', 'task-admin@example.test',     '{"user_type":"staff","staff_role":"admin"}'),
  ('a0000000-0000-0000-0000-000000000005', 'task-partner@example.test',   '{"user_type":"service_provider"}');

insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values
  ('a1000000-0000-0000-0000-00000000000a', 'Task Client A', 'Task Client A (Pty) Ltd', 'Task Client A',
   'a0000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-00000000000b', 'Task Client B', 'Task Client B (Pty) Ltd', 'Task Client B',
   'a0000000-0000-0000-0000-000000000002');

insert into public.providers (id, profile_id, business_name)
values ('a2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'Task Partner');

insert into public.client_tasks (id, client_id, title, notes, due_on, remind_on)
values
  ('a3000000-0000-0000-0000-00000000000a', 'a1000000-0000-0000-0000-00000000000a',
   'Chase the Mokoena invoice', 'They are stalling.', current_date + 5, current_date + 3),
  ('a3000000-0000-0000-0000-00000000000b', 'a1000000-0000-0000-0000-00000000000b',
   'Renew the tax clearance', null, current_date + 10, null);

-- ---------------------------------------------------------------------------
-- The trigger keeps the derived columns honest
-- ---------------------------------------------------------------------------

select is(
  (select completed_at from public.client_tasks where id = 'a3000000-0000-0000-0000-00000000000a'),
  null,
  'a new task has no completion time'
);

update public.client_tasks set status = 'done' where id = 'a3000000-0000-0000-0000-00000000000a';
select isnt(
  (select completed_at from public.client_tasks where id = 'a3000000-0000-0000-0000-00000000000a'),
  null,
  'moving a task to done stamps completed_at'
);

update public.client_tasks set status = 'todo' where id = 'a3000000-0000-0000-0000-00000000000a';
select is(
  (select completed_at from public.client_tasks where id = 'a3000000-0000-0000-0000-00000000000a'),
  null,
  'and pulling it back out clears it again'
);

-- A task reminded once should not be reminded every morning after, but moving
-- the date has to re-arm it or rescheduling would silently do nothing.
update public.client_tasks set reminded_at = now()
where id = 'a3000000-0000-0000-0000-00000000000a';
update public.client_tasks set remind_on = current_date + 4
where id = 'a3000000-0000-0000-0000-00000000000a';
select is(
  (select reminded_at from public.client_tasks where id = 'a3000000-0000-0000-0000-00000000000a'),
  null,
  'rescheduling a reminder re-arms it'
);

-- ---------------------------------------------------------------------------
-- Constraints
-- ---------------------------------------------------------------------------

select throws_ok(
  $$insert into public.client_tasks (client_id, title)
    values ('a1000000-0000-0000-0000-00000000000a', '   ')$$,
  '23514',
  null,
  'a blank title is refused'
);

select throws_ok(
  $$insert into public.client_tasks (client_id, title, due_on, remind_on)
    values ('a1000000-0000-0000-0000-00000000000a', 'Late reminder',
            current_date + 1, current_date + 9)$$,
  '23514',
  null,
  'a reminder cannot fall after the thing it reminds about'
);

-- ---------------------------------------------------------------------------
-- The client owns its board
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is((select count(*)::int from public.client_tasks), 1, 'a client sees only its own tasks');
select is(
  (select title from public.client_tasks),
  'Chase the Mokoena invoice',
  'and it is the right one'
);

with changed as (update public.client_tasks set status = 'in_progress' returning 1)
select is((select count(*)::int from changed), 1, 'a client moves its own task between columns');

with changed as (
  update public.client_tasks set title = 'Rewritten'
  where client_id = 'a1000000-0000-0000-0000-00000000000b' returning 1
)
select is((select count(*)::int from changed), 0, 'and cannot touch another client''s');

-- Checked with the policies off, because client A cannot read that row at all,
-- which is the stronger fact.
reset role;
select is(
  (select title from public.client_tasks where client_id = 'a1000000-0000-0000-0000-00000000000b'),
  'Renew the tax clearance',
  'the other client''s task is untouched'
);
set local role authenticated;

select throws_ok(
  $$insert into public.client_tasks (client_id, title)
    values ('a1000000-0000-0000-0000-00000000000b', 'Smuggled')$$,
  '42501',
  null,
  'nor file a task on another client''s board'
);

with removed as (delete from public.client_tasks returning 1)
select is((select count(*)::int from removed), 1, 'a client deletes its own task');

-- ---------------------------------------------------------------------------
-- Nobody else, at all
-- ---------------------------------------------------------------------------
--
-- There is no staff policy and no partner policy on this table. These are zero
-- by absence rather than by a rule that could be loosened by accident, and
-- admin is checked explicitly because admin reaches everything else.

set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is((select count(*)::int from public.client_tasks), 0, 'operations sees no task board');

set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is((select count(*)::int from public.client_tasks), 0, 'nor does an administrator');

with changed as (update public.client_tasks set title = 'Seen by staff' returning 1)
select is((select count(*)::int from changed), 0, 'and an administrator rewrites nothing');

set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000005","role":"authenticated"}';
select is((select count(*)::int from public.client_tasks), 0, 'a partner sees no task board');

select * from finish();
rollback;
