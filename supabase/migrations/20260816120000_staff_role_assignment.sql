-- Tranche 4 of the staff role split: assigning a role, and never losing the
-- ability to assign one.
--
-- The previous tranche made staff_role administrator-only, which was correct
-- and left the system with no way to grant a role at all — a change now needs a
-- direct statement against the database. This adds the operation, and the one
-- protection that operation makes necessary.

-- ---------------------------------------------------------------------------
-- 1. There must always be an administrator
-- ---------------------------------------------------------------------------
--
-- Only an administrator may assign a role, so an estate with no administrator
-- can never gain one back through the product. Compliance thresholds, partner
-- tiers and role assignment itself would all be permanently unreachable, and
-- the only route back would be a manual statement against the database.
--
-- The check lives in the trigger rather than in the function below, so it holds
-- whichever way the row is written — including a direct update by an
-- administrator, which is exactly how it would happen by accident.

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_type is distinct from old.user_type
     or new.staff_role is distinct from old.staff_role
     or new.status is distinct from old.status then
    if not public.is_staff_admin() then
      raise exception
        'Only an administrator may change user_type, staff_role, or status';
    end if;
  end if;

  -- Was this row an active staff administrator, and is it about to stop being
  -- one? Then it may not be the last.
  if old.user_type = 'staff' and old.staff_role = 'admin' and old.status = 'active'
     and (new.user_type is distinct from old.user_type
          or new.staff_role is distinct from old.staff_role
          or new.status is distinct from old.status)
  then
    if not exists (
      select 1 from public.profiles p
      where p.id <> old.id
        and p.user_type = 'staff'
        and p.staff_role = 'admin'
        and p.status = 'active'
    ) then
      raise exception
        'This is the only administrator. Appoint another one before changing this account.';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.guard_profile_privileges() is
  'Only an administrator may change user_type, staff_role or status, and the last active administrator may not be demoted.';

-- ---------------------------------------------------------------------------
-- 2. Assigning a role
-- ---------------------------------------------------------------------------
--
-- The same shape as set_provider_tier: the caller is checked inside the
-- function rather than trusted to have been checked before it, so the rule
-- holds for anything that can reach the database.

create or replace function public.set_staff_role(
  p_profile_id uuid,
  p_role public.staff_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_type public.user_type;
begin
  if not public.is_staff_admin() then
    raise exception 'Only an administrator may assign a staff role';
  end if;

  select p.user_type into v_user_type
  from public.profiles p where p.id = p_profile_id;

  if v_user_type is null then
    raise exception 'No such account';
  end if;

  -- A role on a client or a partner would be silently meaningless: every check
  -- in the system reads staff_role only after user_type = 'staff'.
  if v_user_type <> 'staff' then
    raise exception 'Only a staff account can hold a staff role';
  end if;

  update public.profiles set staff_role = p_role where id = p_profile_id;
end;
$$;

comment on function public.set_staff_role(uuid, public.staff_role) is
  'Admin-only staff role assignment. The last active administrator cannot be demoted.';

revoke all on function public.set_staff_role(uuid, public.staff_role) from public;
grant execute on function public.set_staff_role(uuid, public.staff_role) to authenticated;
