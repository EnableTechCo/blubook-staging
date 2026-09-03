-- Room in the notification system for a task reminder.
--
-- Separate file on purpose: a value added to an enum cannot be used in the
-- transaction that adds it, and the sweep in the next migration uses this one.

alter type public.notification_type add value if not exists 'task_reminder';

-- The link back to the task, so a reminder can be cleared with the task it is
-- about rather than outliving it as an orphan the client cannot act on.
alter table public.notifications
  add column if not exists task_id uuid references public.client_tasks (id) on delete cascade;

comment on column public.notifications.task_id is
  'The task a reminder is about. Null for every other notification type.';

-- No policy change. notifications is already recipient-only — select, update
-- and delete are all gated on recipient_id = auth.uid(), with no staff policy —
-- so a reminder carrying a private task title is readable only by the client it
-- was raised for. That is what keeps the task board private once its contents
-- start appearing in the notification bell.
