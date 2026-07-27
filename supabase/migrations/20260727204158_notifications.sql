-- Notifications (system #10)
--
-- Real-time delivery of updates and reminders. Notifications own no subject
-- matter of their own; they are generated from events elsewhere:
--   * request status changes -> a trigger on the request_events trail
--   * document expiry warnings -> a generator over documents.expires_at
-- (Calendar/tax-deadline reminders are deferred until a deadlines backend
-- exists.)
--
-- Anonymity: notification text references the request by reference and the new
-- status only -- never the counterparty's identity. Recipients are resolved to
-- the client's primary contact and the assigned provider; the actor who caused a
-- change is not notified of their own action.

create type public.notification_type as enum ('request_status', 'document_expiry');

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  type         public.notification_type not null,
  title        text not null,
  body         text,
  request_id   uuid references public.service_requests (id) on delete cascade,
  document_id  uuid references public.documents (id) on delete cascade,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

comment on table public.notifications is
  'Per-recipient in-app notifications, generated from events across the platform.';

create index notifications_recipient_unread_idx
  on public.notifications (recipient_id, read_at);
create index notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- A recipient sees and manages only their own notifications. Rows are created by
-- the SECURITY DEFINER trigger/generator below, so there is no INSERT policy.

alter table public.notifications enable row level security;

create policy notifications_select on public.notifications
  for select to authenticated
  using (recipient_id = (select auth.uid()));

create policy notifications_update on public.notifications
  for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

create policy notifications_delete on public.notifications
  for delete to authenticated
  using (recipient_id = (select auth.uid()));

grant select, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;

-- ---------------------------------------------------------------------------
-- Request status-change notifications (trigger on the event trail)
-- ---------------------------------------------------------------------------

create or replace function public.create_status_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client_id      uuid;
  v_provider_id    uuid;
  v_reference      text;
  v_client_profile uuid;
  v_provider_profile uuid;
  v_label          text;
begin
  select sr.client_id, sr.provider_id, sr.reference
    into v_client_id, v_provider_id, v_reference
  from public.service_requests sr
  where sr.id = new.request_id;

  v_label := replace(new.to_status::text, '_', ' ');

  -- Client's primary contact (unless they made the change).
  select primary_profile_id into v_client_profile from public.clients where id = v_client_id;
  if v_client_profile is not null and v_client_profile is distinct from new.actor_id then
    insert into public.notifications (recipient_id, type, title, body, request_id)
    values (v_client_profile, 'request_status',
            'Request ' || v_reference || ' updated',
            'Status is now ' || v_label || '.', new.request_id);
  end if;

  -- Assigned provider (unless they made the change).
  if v_provider_id is not null then
    select profile_id into v_provider_profile from public.providers where id = v_provider_id;
    if v_provider_profile is not null and v_provider_profile is distinct from new.actor_id then
      insert into public.notifications (recipient_id, type, title, body, request_id)
      values (v_provider_profile, 'request_status',
              'Request ' || v_reference || ' updated',
              'Status is now ' || v_label || '.', new.request_id);
    end if;
  end if;

  return new;
end;
$$;

create trigger request_events_notify
  after insert on public.request_events
  for each row execute function public.create_status_notifications();

-- ---------------------------------------------------------------------------
-- Document expiry warnings (generator; run on demand / by a scheduled job)
-- ---------------------------------------------------------------------------
-- Creates one document_expiry notification per (document, client contact) for
-- documents expiring within p_within_days, skipping any already created.

create or replace function public.generate_expiry_notifications(p_within_days integer default 30)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if (select auth.uid()) is not null and not public.is_staff() then
    raise exception 'Not authorized to generate notifications';
  end if;

  insert into public.notifications (recipient_id, type, title, body, document_id)
  select c.primary_profile_id, 'document_expiry',
         'Document expiring: ' || d.title,
         'Expires on ' || to_char(d.expires_at, 'DD Mon YYYY') || '.', d.id
  from public.documents d
  join public.clients c on c.id = d.client_id
  where d.expires_at is not null
    and d.expires_at <= (current_date + make_interval(days => p_within_days))
    and c.primary_profile_id is not null
    and not exists (
      select 1 from public.notifications n
      where n.document_id = d.id
        and n.type = 'document_expiry'
        and n.recipient_id = c.primary_profile_id
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.generate_expiry_notifications(integer) from public;
grant execute on function public.generate_expiry_notifications(integer) to authenticated, service_role;
