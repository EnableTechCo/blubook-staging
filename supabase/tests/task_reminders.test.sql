begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

-- The sweep is the whole point of the reminder field, and it runs where nobody
-- is watching. These assertions are the only thing standing between "a client
-- set a reminder" and "a client was reminded".

insert into auth.users (id, email, raw_user_meta_data)
values
  ('b0000000-0000-0000-0000-000000000001', 'sweep-client@example.test', '{"user_type":"client"}'),
  ('b0000000-0000-0000-0000-000000000002', 'sweep-staff@example.test',  '{"user_type":"staff","staff_role":"admin"}');

insert into public.clients (id, business_name, registered_name, trading_name, primary_profile_id)
values ('b1000000-0000-0000-0000-00000000000a', 'Sweep Client', 'Sweep Client (Pty) Ltd',
        'Sweep Client', 'b0000000-0000-0000-0000-000000000001');

insert into public.client_tasks (id, client_id, title, status, due_on, remind_on)
values
  -- due for a reminder today
  ('b2000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-00000000000a',
   'Reminder due today', 'todo', current_date + 2, current_date),
  -- reminder still in the future
  ('b2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-00000000000a',
   'Reminder later', 'todo', current_date + 9, current_date + 8),
  -- overdue and still open
  ('b2000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-00000000000a',
   'Overdue and open', 'todo', current_date - 3, null),
  -- overdue but finished: must stay silent
  ('b2000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-00000000000a',
   'Overdue but done', 'done', current_date - 3, current_date - 3);

select is(public.run_task_reminder_sweep(), 2, 'the sweep raises exactly the two that are due');

select is(
  (select count(*)::int from public.notifications
   where task_id = 'b2000000-0000-0000-0000-000000000001'),
  1,
  'the reminder due today was raised'
);

select is(
  (select urgent from public.notifications
   where task_id = 'b2000000-0000-0000-0000-000000000001'),
  false,
  'and a reminder is not urgent on its own'
);

select is(
  (select urgent from public.notifications
   where task_id = 'b2000000-0000-0000-0000-000000000003'),
  true,
  'but an overdue task is urgent, so it takes precedence in the tab'
);

select is(
  (select count(*)::int from public.notifications
   where task_id = 'b2000000-0000-0000-0000-000000000002'),
  0,
  'a reminder set for next week stays quiet'
);

select is(
  (select count(*)::int from public.notifications
   where task_id = 'b2000000-0000-0000-0000-000000000004'),
  0,
  'and a finished task is never chased, however late it was'
);

-- Running twice is the normal case: cron fires every morning whether or not
-- anything changed. The second run must be silent.
select is(public.run_task_reminder_sweep(), 0, 'a second run the same day raises nothing');

-- Moving the date is how a client snoozes. If that did not re-arm the sweep,
-- rescheduling would look like it worked and then never fire.
update public.client_tasks set remind_on = current_date
where id = 'b2000000-0000-0000-0000-000000000002';
select is(public.run_task_reminder_sweep(), 1, 'rescheduling a reminder makes it fire again');

-- ---------------------------------------------------------------------------
-- The reminder must not become the leak
-- ---------------------------------------------------------------------------
--
-- A reminder carries the task's title, which is private. notifications is
-- recipient-only with no staff policy, so this holds — but it holds by a
-- policy on another table, which is exactly the kind of thing that gets
-- loosened later without anyone connecting it back to the task board.

set local role authenticated;

set local request.jwt.claims = '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is(
  (select count(*)::int from public.notifications where task_id is not null),
  3,
  'the client sees its own task reminders'
);

set local request.jwt.claims = '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is(
  (select count(*)::int from public.notifications where task_id is not null),
  0,
  'an administrator sees none of them'
);
select is(
  (select count(*)::int from public.client_tasks),
  0,
  'and still cannot read the board they came from'
);

select * from finish();
rollback;
