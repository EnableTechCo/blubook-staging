-- Staff role breakdown
--
-- Internal staff were modelled as a single 'sales' role alongside operations and
-- admin. Transactions raised by clients route to different internal desks --
-- purchase orders to a sales rep, tender applications to sales admin -- so the
-- role set is broken out:
--
--   sales_rep    -- owns client sales orders / purchase orders
--   sales_admin  -- owns tender applications
--   operations   -- runs service delivery
--   admin        -- platform administration
--   marketing    -- marketing
--
-- Existing 'sales' staff become 'sales_rep'. The enum is recreated rather than
-- extended so the retired value cannot be assigned again.

create type public.staff_role_new as enum (
  'sales_rep', 'sales_admin', 'operations', 'admin', 'marketing'
);

alter table public.profiles
  alter column staff_role type public.staff_role_new
  using (
    case staff_role::text
      when 'sales' then 'sales_rep'
      else staff_role::text
    end
  )::public.staff_role_new;

drop type public.staff_role;
alter type public.staff_role_new rename to staff_role;

comment on column public.profiles.staff_role is
  'Internal desk for staff profiles; null for clients and service providers.';
