-- The client's banking details, for its letterhead.
--
-- A table of its own rather than columns on public.clients, and the reason is
-- the whole point of the feature: RLS is row-level. Every staff role can read
-- clients, so a bank_account_number column there would be readable by all of
-- them, and hiding it would mean the table-grant and column-revoke surgery the
-- partner tier needed — which was fragile enough once.
--
-- Here the rule is one policy: the client, and nobody else.
--
-- There is deliberately no staff policy. Not a narrow one, none — so nothing
-- can be widened by accident later, and "client only" is true by absence
-- rather than by a condition somebody has to keep getting right. It follows
-- that these are entered by the client in its own workspace rather than by
-- staff at onboarding: an onboarding form is completed by operations, and a
-- detail typed by operations is not a detail only the client has seen.
--
-- The service role still bypasses RLS, as it does everywhere. No server action
-- reads this table, and the one that will render a letterhead runs under the
-- client's own session.

create table public.client_banking_details (
  -- One set per client: a letterhead carries one bank account, and a second row
  -- would only raise the question of which.
  client_id      uuid primary key references public.clients (id) on delete cascade,

  bank_name      text not null,
  account_name   text not null,
  account_number text not null,
  branch_code    text not null,
  account_type   text,
  swift_code     text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint client_banking_bank_name_not_blank   check (btrim(bank_name) <> ''),
  constraint client_banking_account_name_not_blank check (btrim(account_name) <> ''),
  constraint client_banking_account_no_not_blank  check (btrim(account_number) <> ''),
  constraint client_banking_branch_code_not_blank check (btrim(branch_code) <> '')
);

create trigger client_banking_details_set_updated_at
  before update on public.client_banking_details
  for each row execute function public.set_updated_at();

alter table public.client_banking_details enable row level security;

create policy client_banking_details_own on public.client_banking_details
  for all to authenticated
  using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());

grant select, insert, update, delete on public.client_banking_details to authenticated;
grant all on public.client_banking_details to service_role;

comment on table public.client_banking_details is
  'Client-only. No staff policy exists, deliberately: the client is the only reader.';
