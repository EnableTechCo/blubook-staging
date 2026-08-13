-- An active client account is not the same as a completed onboarding. Keep the
-- onboarding open until every document on its compliance checklist is verified.

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
  set status = case when v_complete then 'completed' else 'awaiting_documents' end,
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

create trigger onboarding_documents_sync_completion
  after insert or update of status or delete on public.onboarding_documents
  for each row execute function public.sync_onboarding_completion();

-- Repair onboardings created as completed while their checklist was still open.
update public.onboardings o
set status = 'awaiting_documents',
    completed_at = null
where o.status = 'completed'
  and (
    not exists (
      select 1
      from public.onboarding_documents od
      where od.onboarding_id = o.id
    )
    or exists (
      select 1
      from public.onboarding_documents od
      where od.onboarding_id = o.id
        and od.status <> 'verified'
    )
  );

revoke execute on function public.sync_onboarding_completion() from public, anon, authenticated;
grant execute on function public.sync_onboarding_completion() to service_role;
