-- Secure invitation-led onboarding foundation.
-- Existing customers retain their current Finance access; newly provisioned
-- customers remain locked until their separate Finance onboarding completes.

alter table public.onboardings
  add column sales_review_status text not null default 'awaiting_review'
    check (sales_review_status in ('awaiting_review', 'changes_requested', 'approved')),
  add column sales_review_note text,
  add column sales_reviewed_by uuid references public.profiles (id) on delete set null,
  add column sales_reviewed_at timestamptz;

-- Existing onboardings predate the Sales checkpoint; preserve their approved state.
update public.onboardings set sales_review_status = 'approved';

alter table public.clients
  add column finance_onboarding_complete boolean not null default false;

-- Backward compatibility: every customer that existed before this flow keeps
-- the finance capability it already had. New customers retain false.
update public.clients set finance_onboarding_complete = true;

create table public.onboarding_invites (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  token_hash   text not null unique,
  invited_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz,
  expires_at   timestamptz not null default (now() + interval '7 days'),
  claimed_at   timestamptz,
  consumed_at  timestamptz,
  client_id    uuid references public.clients (id) on delete set null,
  constraint onboarding_invites_email_not_empty check (length(trim(email)) > 3),
  constraint onboarding_invites_hash_not_empty check (length(token_hash) >= 64)
);

create index onboarding_invites_email_idx on public.onboarding_invites (lower(email));
create index onboarding_invites_open_idx on public.onboarding_invites (expires_at)
  where consumed_at is null;

comment on table public.onboarding_invites is
  'Single-use, expiring customer onboarding invitations. Raw tokens are never stored.';
comment on column public.onboarding_invites.token_hash is
  'SHA-256 digest of the one-time URL token; the usable token exists only in the email link.';
comment on column public.onboarding_invites.claimed_at is
  'Atomic submission lock. Cleared if provisioning rolls back so the customer can retry.';

alter table public.onboarding_invites enable row level security;
revoke all on public.onboarding_invites from anon, authenticated;
grant all on public.onboarding_invites to service_role;

-- The Finance work group cannot discover a new customer's legal identity from
-- the active package alone. Legacy customers remain unaffected through the
-- backfill above. The future Finance onboarding slice will grant access to the
-- specifically claimed provider after completion.
create or replace function public.can_see_client_identity(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.is_staff()
    or p_client_id = public.current_client_id()
    or exists (
      select 1
      from public.providers p
      join public.work_group_members wgm on wgm.provider_id = p.id
      join public.service_groups g on g.id = wgm.work_group_id
      join public.services s on s.group_id = g.id
      join public.line_items li on li.service_id = s.id
      join public.client_package_line_items cpli on cpli.source_line_item_id = li.id
      join public.client_packages cp on cp.id = cpli.client_package_id
      join public.clients c on c.id = cp.client_id
      where p.id = public.current_provider_id()
        and p.tier = 'premium'
        and cp.client_id = p_client_id
        and cp.status = 'active'
        and (
          not g.submits_financials
          or c.finance_onboarding_complete
        )
    ),
    false
  );
$$;

comment on function public.can_see_client_identity(uuid) is
  'True for staff, the customer, and eligible premium partners; new Finance identities stay private until Finance onboarding completes.';

create or replace function public.can_submit_client_financials(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.providers p
      join public.work_group_members wgm on wgm.provider_id = p.id
      join public.service_groups g on g.id = wgm.work_group_id
      join public.services s on s.group_id = g.id
      join public.line_items li on li.service_id = s.id
      join public.client_package_line_items cpli on cpli.source_line_item_id = li.id
      join public.client_packages cp on cp.id = cpli.client_package_id
      join public.clients c on c.id = cp.client_id
      where p.id = public.current_provider_id()
        and p.tier = 'premium'
        and g.submits_financials
        and g.active
        and cp.client_id = p_client_id
        and cp.status = 'active'
        and c.finance_onboarding_complete
    ),
    false
  );
$$;

comment on function public.can_submit_client_financials(uuid) is
  'True only for a premium Finance partner when the client has completed Finance onboarding and an active package covers the partner group.';

-- A newly provisioned partial account must not read even its own finance
-- figures through the Supabase API before the separate finance step completes.
drop policy if exists client_financials_select_own on public.client_financials;
create policy client_financials_select_own on public.client_financials
  for select to authenticated
  using (
    public.has_staff_role('operations')
    or (
      client_id = public.current_client_id()
      and exists (
        select 1 from public.clients c
        where c.id = client_id and c.finance_onboarding_complete
      )
    )
  );

alter type public.notification_type add value if not exists 'onboarding_review';
