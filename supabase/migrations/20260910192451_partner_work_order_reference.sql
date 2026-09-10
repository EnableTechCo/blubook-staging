-- The partner work order number, issued by the platform.
--
-- service_requests.partner_work_order_reference was added in July as "an
-- optional identifier supplied by the assigned partner", and nothing ever
-- supplied it: no form, no action, no function wrote the column, so every
-- table showed a dash. It is now a platform number in the house style —
-- WO-000001, a prefix and a six-digit global sequence, the same shape as
-- CUS-000001 and the SYS-/CLI-/PRV- request references.
--
-- When it is issued matters. Routing hands a request to a partner as an offer
-- (status 'open'), and acceptance is what makes the work theirs. The work
-- order is stamped at acceptance — the first time a request with a provider
-- reaches 'assigned' — so a partner who declines an offer never holds a
-- number, and a request waiting on an answer does not look like a job in
-- progress. If staff move a request to a different partner, the old number is
-- cleared and a new one is issued when the new partner accepts: the number
-- names one partner's job, not the request.
--
-- Staff may still overwrite it by hand, and the trigger leaves a value alone
-- once set. Partners may not touch it at all; the update guard now says so.

create sequence public.partner_work_order_seq;

comment on sequence public.partner_work_order_seq is
  'Global counter behind partner work order numbers (WO-000001). Never reused.';

create or replace function public.stamp_partner_work_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- A different partner is a different job; their number is issued when they
  -- accept, below, or immediately if staff moved an already-accepted request.
  if tg_op = 'UPDATE' and new.provider_id is distinct from old.provider_id then
    new.partner_work_order_reference := null;
  end if;

  if new.provider_id is not null
     and new.partner_work_order_reference is null
     and new.status in ('assigned', 'in_progress', 'completed') then
    new.partner_work_order_reference :=
      'WO-' || lpad(nextval('public.partner_work_order_seq')::text, 6, '0');
  end if;

  return new;
end;
$$;

comment on function public.stamp_partner_work_order() is
  'Issues WO-nnnnnn the first time a request with a provider reaches assigned; reissues when the provider changes.';

-- Fires after the guard (before-triggers run in name order, and "guard" sorts
-- before "stamp"), so a partner writing the column is refused before anything
-- is stamped.
create trigger service_requests_stamp_work_order
  before insert or update on public.service_requests
  for each row execute function public.stamp_partner_work_order();

-- ---------------------------------------------------------------------------
-- The update guard: partners cannot change the number
-- ---------------------------------------------------------------------------
-- Same body as 20260731093000, plus one line. A partner owns its requests
-- under RLS, so without this the column would be theirs to edit.

create or replace function public.guard_and_stamp_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at := now();
  end if;

  -- Guard only real authenticated non-staff users. The service role (routing /
  -- system generation) has no auth.uid() and is trusted to assign providers.
  if (select auth.uid()) is not null and not public.is_staff() then
    if new.provider_id is distinct from old.provider_id
       or new.client_id is distinct from old.client_id
       or new.origin is distinct from old.origin
       or new.request_type is distinct from old.request_type
       or new.reference is distinct from old.reference
       or new.partner_work_order_reference is distinct from old.partner_work_order_reference then
      raise exception 'Only staff may change assignment or request identity fields';
    end if;
  end if;

  return new;
end;
$$;

comment on column public.service_requests.partner_work_order_reference is
  'Platform-issued work order number (WO-000001) for the accepting partner''s job. Stamped at acceptance; reissued if the request moves to another partner. Staff may overwrite; partners may not.';

-- ---------------------------------------------------------------------------
-- Backfill: every request a partner has already accepted gets its number, in
-- the order the requests were created, so the sequence reads as history.
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select id from public.service_requests
    where provider_id is not null
      and partner_work_order_reference is null
      and status in ('assigned', 'in_progress', 'completed')
    order by created_at, id
  loop
    update public.service_requests
      set partner_work_order_reference = 'WO-' || lpad(nextval('public.partner_work_order_seq')::text, 6, '0')
      where id = r.id;
  end loop;
end $$;
