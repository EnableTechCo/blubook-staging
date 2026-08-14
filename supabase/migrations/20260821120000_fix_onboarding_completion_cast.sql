-- sync_onboarding_completion could never run.
--
-- `case when v_complete then 'completed' else 'awaiting_documents' end` is two
-- untyped literals, so the case resolves to text, and onboardings.status is
-- public.onboarding_status. Postgres will not assign one to the other:
--
--   ERROR: column "status" is of type onboarding_status
--          but expression is of type text
--
-- plpgsql plans a statement the first time it runs rather than when the
-- function is created, so the migration applied cleanly and the function was
-- only broken once something made it fire. That is every insert, every status
-- change and every delete on onboarding_documents — which is the whole of
-- document review. Reproduced on the live database before this was written.
--
-- The fix is the cast. Everything else about the function is unchanged.

create or replace function public.sync_onboarding_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_onboarding_id uuid;
  v_complete boolean;
begin
  v_onboarding_id := case
    when tg_op = 'DELETE' then old.onboarding_id
    else new.onboarding_id
  end;

  select exists (
      select 1
      from public.onboarding_documents
      where onboarding_id = v_onboarding_id
    ) and not exists (
      select 1
      from public.onboarding_documents
      where onboarding_id = v_onboarding_id
        and status <> 'verified'
    )
  into v_complete;

  update public.onboardings
  set status = case
        when v_complete then 'completed'
        else 'awaiting_documents'
      end::public.onboarding_status,
      completed_at = case
        when v_complete then coalesce(completed_at, now())
        else null
      end
  where id = v_onboarding_id
    and status <> 'cancelled';

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke execute on function public.sync_onboarding_completion() from public, anon, authenticated;
grant execute on function public.sync_onboarding_completion() to service_role;
