-- Staff role helpers
--
-- `staff_role` has existed since the first migration and has never been read:
-- fifty-five policies gate on is_staff(), which is only `user_type = 'staff'`,
-- and none reference the role. So every staff member can read every client's
-- financials, rewrite the compliance thresholds each client is scored against,
-- and promote a partner to premium — which lifts client anonymity.
--
-- This migration adds the helpers and changes nothing else. No policy moves
-- here, so nothing can break; the tranches that follow move policies onto
-- these functions one area at a time, and each is measurable on its own.

/**
 * The calling staff member's role, or null for anyone who is not staff.
 *
 * security definer because profiles is behind RLS and a policy that has to
 * read the caller's own role cannot depend on a policy that reads profiles.
 */
create or replace function public.current_staff_role()
returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.staff_role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.user_type = 'staff';
$$;

comment on function public.current_staff_role() is
  'The calling staff member''s role, or null when the caller is not staff.';

/**
 * True when the caller holds any of the given roles.
 *
 * Admin passes every check without being listed. That is deliberate: the
 * alternative is naming admin in every policy, and the first one anybody
 * forgets locks the administrator out of the thing only an administrator was
 * meant to do. Expressing "operations but explicitly not admin" is not a rule
 * this product needs, and the cost of getting it wrong is far higher.
 *
 * Returns false rather than null for a non-staff caller: `false or null` is
 * null in SQL, so a null here would poison any policy that combines this with
 * another condition, and `not has_staff_role(...)` would match no rows at all.
 */
create or replace function public.has_staff_role(variadic p_roles public.staff_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_staff_role() = 'admin'
    or public.current_staff_role() = any(p_roles),
    false
  );
$$;

comment on function public.has_staff_role(public.staff_role[]) is
  'True when the caller holds one of the given staff roles. Admin passes every check.';

/** Shorthand for the checks that only an administrator may pass. */
create or replace function public.is_staff_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_staff_role() = 'admin', false);
$$;

comment on function public.is_staff_admin() is
  'True only for staff whose role is admin.';

revoke all on function public.current_staff_role from public;
revoke all on function public.has_staff_role(public.staff_role[]) from public;
revoke all on function public.is_staff_admin from public;

grant execute on function public.current_staff_role to authenticated;
grant execute on function public.has_staff_role(public.staff_role[]) to authenticated;
grant execute on function public.is_staff_admin to authenticated;
