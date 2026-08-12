-- Schedule the overdue sweep with pg_cron
--
-- The sweep was already idempotent and staff-triggerable; this puts it on a
-- clock so "the system triggers notifications on past due SRs" is true without
-- anyone pressing a button.
--
-- The staff-facing function guards on is_staff(), which is false under cron —
-- a scheduled job has no JWT and therefore no auth.uid(). Rather than weaken
-- that guard, the work moves into an internal function the scheduler calls and
-- nobody else can: it is never granted to authenticated, so the only ways in
-- are the scheduler and the staff wrapper.

create extension if not exists pg_cron;

/**
 * The sweep itself. No caller check, because it is not reachable by a caller:
 * execute is revoked from public and never granted to authenticated.
 */
create or replace function public.run_overdue_request_sweep()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raised integer := 0;
begin
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

revoke all on function public.run_overdue_request_sweep from public;

-- The staff wrapper now delegates rather than duplicating the query, so the two
-- entry points can never drift apart.
create or replace function public.raise_overdue_request_notifications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Only staff can raise overdue notifications';
  end if;
  return public.run_overdue_request_sweep();
end;
$$;

revoke all on function public.raise_overdue_request_notifications from public;
grant execute on function public.raise_overdue_request_notifications to authenticated;

-- 06:00 UTC is 08:00 in Johannesburg: the notice is waiting when the working
-- day starts rather than arriving overnight. Unscheduled first so re-running
-- this migration cannot leave two jobs doing the same work.
do $$
begin
  perform cron.unschedule('blubook-overdue-sweep');
exception when others then
  null; -- no such job yet, which is the normal case
end $$;

select cron.schedule(
  'blubook-overdue-sweep',
  '0 6 * * *',
  $$select public.run_overdue_request_sweep();$$
);
