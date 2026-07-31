-- Constrain request_type to the types we actually define
--
-- request_type was free text: `not null default 'general'` with only a
-- non-empty check. Any signed-in client could write any string through the API
-- — including markup — because the RLS insert policy permits any row for their
-- own business and the guard trigger protects only provider_id, client_id,
-- origin and reference.
--
-- The application never produced a bad value (submissionActions parses a Zod
-- discriminated union of two literals), so this closes the direct-API hole and
-- gives the generated TypeScript types a real union to work with.

create type public.request_type as enum (
  'general',
  'purchase_order',
  'tender_submission'
);

-- Anything unexpected becomes a plain request, so the conversion below succeeds
-- in every environment regardless of what was written directly.
update public.service_requests
set request_type = 'general'
where request_type not in ('general', 'purchase_order', 'tender_submission');

-- The old check tests string length, which cannot apply to an enum.
alter table public.service_requests
  drop constraint if exists service_requests_request_type_check;

alter table public.service_requests
  alter column request_type drop default,
  alter column request_type type public.request_type
    using request_type::public.request_type,
  alter column request_type set default 'general';

comment on column public.service_requests.request_type is
  'What kind of request this is: a plain service request, a purchase order, or a tender submission.';

-- ---------------------------------------------------------------------------
-- A request may not change type after it is raised
-- ---------------------------------------------------------------------------
-- The enum stops arbitrary values, but a client could still flip an existing
-- request into a purchase order without the document workflow behind it.
-- request_type is set once, at creation, by the action that owns the flow.

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
       or new.reference is distinct from old.reference then
      raise exception 'Only staff may change assignment or request identity fields';
    end if;
  end if;

  return new;
end;
$$;
