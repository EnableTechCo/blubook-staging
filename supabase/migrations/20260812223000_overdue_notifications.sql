-- Notifications for past-due service requests
--
-- Deliberately not urgent. The brief is explicit that the bell is for urgent
-- notifications and not for every overdue request, so these land on the
-- notifications page without ringing it.
--
-- Idempotent by design: a request that already has an unread overdue notice
-- does not get a second one, so running this twice in a day is harmless and
-- running it every day never spams.
--
-- It is a function rather than a schedule. pg_cron is available on this project
-- but not installed, and enabling it is an infrastructure decision — it needs
-- shared_preload_libraries, which would also affect every developer's local
-- reset. Scheduling this is a one-line follow-up once somebody decides where
-- the schedule should live; until then staff can run it, and it is safe to run
-- as often as they like.

create or replace function public.raise_overdue_request_notifications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raised integer := 0;
begin
  if not public.is_staff() then
    raise exception 'Only staff can raise overdue notifications';
  end if;

  with overdue as (
    select
      r.id as request_id,
      r.reference,
      r.title,
      c.primary_profile_id as recipient_id,
      s.due_at
    from public.service_requests r
    join public.request_schedules s on s.request_id = r.id
    join public.clients c on c.id = r.client_id
    where r.status not in ('completed', 'cancelled')
      and s.due_at is not null
      and s.due_at < now()
      and c.primary_profile_id is not null
      -- Already told them, and they have not read it yet.
      and not exists (
        select 1
        from public.notifications n
        where n.request_id = r.id
          and n.type = 'request_status'
          and n.read_at is null
      )
  )
  insert into public.notifications (recipient_id, type, urgent, title, body, request_id)
  select
    o.recipient_id,
    'request_status',
    false,
    o.reference || ' is past due',
    o.title || ' was due ' || to_char(o.due_at at time zone 'Africa/Johannesburg', 'DD Mon YYYY') || '.',
    o.request_id
  from overdue o;

  get diagnostics v_raised = row_count;
  return v_raised;
end;
$$;

comment on function public.raise_overdue_request_notifications() is
  'Raises a non-urgent notification for every past-due open request that does not already have an unread one. Safe to run repeatedly.';

revoke all on function public.raise_overdue_request_notifications from public;
grant execute on function public.raise_overdue_request_notifications to authenticated;
