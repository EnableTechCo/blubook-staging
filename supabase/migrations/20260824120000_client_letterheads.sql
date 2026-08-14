-- The client's letterhead.
--
-- A composition rather than a picture. The letterhead holds the choices — what
-- to show and what to say — and everything on it is read live at render time
-- from the client's record, its artwork and its banking details. A stored image
-- would be a letterhead you cannot render a quotation onto, and a snapshot of
-- the details would go stale the first time an address changed.
--
-- Client-only, like the banking details it displays. No staff policy exists,
-- for the same reason: a letterhead carries the bank account, so any reader of
-- the letterhead is a reader of the account.

create table public.client_letterheads (
  client_id        uuid primary key references public.clients (id) on delete cascade,

  -- What appears. A client that banks through a separate remittance address
  -- may not want the account on every notice, so this is a choice rather than
  -- an assumption.
  show_banking     boolean not null default true,
  show_registration boolean not null default true,
  show_director    boolean not null default true,

  -- The public-facing contacts, which are not always the login. Blank falls
  -- back to what the client record already holds.
  contact_email    text,
  contact_phone    text,
  website          text,

  -- A standing line at the foot of every document — terms, a disclaimer, or
  -- nothing.
  footer_note      text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger client_letterheads_set_updated_at
  before update on public.client_letterheads
  for each row execute function public.set_updated_at();

alter table public.client_letterheads enable row level security;

create policy client_letterheads_own on public.client_letterheads
  for all to authenticated
  using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());

grant select, insert, update, delete on public.client_letterheads to authenticated;
grant all on public.client_letterheads to service_role;

comment on table public.client_letterheads is
  'Client-only. Holds letterhead choices; the details themselves are read live at render time.';
