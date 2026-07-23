-- Onboarding & packages (system #4)
--
-- Owns the client's journey from sales conversation to a live account: the
-- sales rep walking a client through packages, the assembly of a package
-- (standard tier or Flex) from the service catalogue, the collection of
-- compliance documents (checklist only here; file storage is system #8), and
-- the creation of the client business account.
--
-- Design notes:
--  * A client is a business account (clients) with a primary contact profile.
--    The profile is created via auth and linked when the account goes live, so
--    primary_profile_id is nullable during onboarding.
--  * Purchased packages are SNAPSHOTTED: line items and prices are copied into
--    client-owned rows so later catalogue/price changes never alter what a
--    client bought. Service requests (system #5) generate from these snapshots.
--  * Reuses is_staff() and set_updated_at(); references catalogue + identity.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.client_status as enum ('pending', 'active', 'suspended');

create type public.onboarding_status as enum (
  'draft', 'in_progress', 'awaiting_documents', 'completed', 'cancelled'
);

-- Whether an assembled client package came from a standard tier or was a
-- custom Flex composition. (Catalogue packages are all standard; Flex only
-- ever exists as an assembled client package.)
create type public.package_type as enum ('standard', 'flex');

create type public.client_package_status as enum ('active', 'cancelled');

create type public.compliance_status as enum (
  'outstanding', 'received', 'verified', 'rejected'
);

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
-- The client business account. Downstream systems (requests, documents,
-- dashboard) reference the business, not the individual user.

create table public.clients (
  id                 uuid primary key default gen_random_uuid(),
  business_name      text not null,
  primary_profile_id uuid unique references public.profiles (id) on delete set null,
  status             public.client_status not null default 'pending',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.clients is
  'Client business accounts; the entity downstream systems reference.';

-- ---------------------------------------------------------------------------
-- onboardings
-- ---------------------------------------------------------------------------
-- One sales-rep-driven onboarding case per attempt to bring a client live.

create table public.onboardings (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients (id) on delete cascade,
  sales_rep_id uuid references public.profiles (id) on delete set null,
  status       public.onboarding_status not null default 'draft',
  notes        text,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.onboardings is
  'Sales-rep-driven onboarding cases tracking a client from draft to live.';

create index onboardings_client_id_idx on public.onboardings (client_id);
create index onboardings_sales_rep_id_idx on public.onboardings (sales_rep_id);
create index onboardings_status_idx on public.onboardings (status);

-- ---------------------------------------------------------------------------
-- client_packages
-- ---------------------------------------------------------------------------
-- A package a client has bought. Standard packages copy a catalogue package's
-- tier and set price; Flex packages have a derived total. source_package_id is
-- kept for reference but nulled if the catalogue package is later removed.

create table public.client_packages (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients (id) on delete cascade,
  onboarding_id    uuid references public.onboardings (id) on delete set null,
  type             public.package_type not null,
  source_package_id uuid references public.packages (id) on delete set null,
  tier             public.service_tier,
  name             text not null,
  total_price      numeric(12, 2) not null check (total_price >= 0),
  status           public.client_package_status not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Standard packages carry a tier; Flex packages do not.
  constraint client_packages_tier_by_type check (
    (type = 'standard' and tier is not null)
    or (type = 'flex' and tier is null)
  )
);

comment on table public.client_packages is
  'Packages a client bought (standard or flex), with a snapshot total price.';

create index client_packages_client_id_idx on public.client_packages (client_id);
create index client_packages_onboarding_id_idx on public.client_packages (onboarding_id);

-- ---------------------------------------------------------------------------
-- client_package_line_items
-- ---------------------------------------------------------------------------
-- Snapshot of the line items composing a client package, with the price at
-- purchase. Denormalised so the record survives catalogue changes;
-- source_line_item_id links back to the catalogue but is nulled on deletion.
-- Service requests are generated from these rows.

create table public.client_package_line_items (
  id                  uuid primary key default gen_random_uuid(),
  client_package_id   uuid not null references public.client_packages (id) on delete cascade,
  source_line_item_id uuid references public.line_items (id) on delete set null,
  name                text not null,
  tier                public.service_tier not null,
  unit_price          numeric(12, 2) not null check (unit_price >= 0),
  quantity            integer not null default 1 check (quantity > 0),
  created_at          timestamptz not null default now()
);

comment on table public.client_package_line_items is
  'Snapshotted line items of a client package; requests generate from these.';

create index client_package_line_items_pkg_idx
  on public.client_package_line_items (client_package_id);

-- ---------------------------------------------------------------------------
-- compliance_document_types
-- ---------------------------------------------------------------------------
-- Master list of compliance document types collected at onboarding. Reference
-- data managed by staff; file storage arrives with Document management (#8).

create table public.compliance_document_types (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null unique,
  description text,
  required    boolean not null default true,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.compliance_document_types is
  'Master list of compliance document types required during onboarding.';

-- ---------------------------------------------------------------------------
-- onboarding_documents
-- ---------------------------------------------------------------------------
-- Per-onboarding compliance checklist: which document types are outstanding,
-- received, verified, or rejected. No file storage yet (system #8).

create table public.onboarding_documents (
  id               uuid primary key default gen_random_uuid(),
  onboarding_id    uuid not null references public.onboardings (id) on delete cascade,
  document_type_id uuid not null references public.compliance_document_types (id) on delete restrict,
  status           public.compliance_status not null default 'outstanding',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (onboarding_id, document_type_id)
);

comment on table public.onboarding_documents is
  'Per-onboarding compliance checklist (status only; files come with system #8).';

create index onboarding_documents_onboarding_id_idx
  on public.onboarding_documents (onboarding_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance (reuses public.set_updated_at)
-- ---------------------------------------------------------------------------

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create trigger onboardings_set_updated_at
  before update on public.onboardings
  for each row execute function public.set_updated_at();

create trigger client_packages_set_updated_at
  before update on public.client_packages
  for each row execute function public.set_updated_at();

create trigger compliance_document_types_set_updated_at
  before update on public.compliance_document_types
  for each row execute function public.set_updated_at();

create trigger onboarding_documents_set_updated_at
  before update on public.onboarding_documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Integrity guard: a client's primary profile must be a client user
-- ---------------------------------------------------------------------------

create or replace function public.guard_client_primary_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.primary_profile_id is not null and not exists (
    select 1 from public.profiles
    where id = new.primary_profile_id and user_type = 'client'
  ) then
    raise exception 'clients.primary_profile_id must reference a client profile';
  end if;
  return new;
end;
$$;

create trigger clients_guard_primary_profile
  before insert or update of primary_profile_id on public.clients
  for each row execute function public.guard_client_primary_profile();

-- ---------------------------------------------------------------------------
-- RLS helper: the current user's client id (if any)
-- ---------------------------------------------------------------------------

create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.clients where primary_profile_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Staff (sales/ops) manage onboarding end to end. A client may read its own
-- business record, onboarding, and packages, but not write them. Providers have
-- no access. compliance_document_types is shared reference data.

alter table public.clients enable row level security;
alter table public.onboardings enable row level security;
alter table public.client_packages enable row level security;
alter table public.client_package_line_items enable row level security;
alter table public.compliance_document_types enable row level security;
alter table public.onboarding_documents enable row level security;

-- clients: read own or staff; only staff write.
create policy clients_select on public.clients
  for select to authenticated
  using (id = public.current_client_id() or public.is_staff());
create policy clients_write on public.clients
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- onboardings: client reads its own; only staff write.
create policy onboardings_select on public.onboardings
  for select to authenticated
  using (client_id = public.current_client_id() or public.is_staff());
create policy onboardings_write on public.onboardings
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- client_packages: client reads its own; only staff write.
create policy client_packages_select on public.client_packages
  for select to authenticated
  using (client_id = public.current_client_id() or public.is_staff());
create policy client_packages_write on public.client_packages
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- client_package_line_items: client reads items of its own packages; staff all.
create policy client_package_line_items_select on public.client_package_line_items
  for select to authenticated
  using (
    public.is_staff()
    or client_package_id in (
      select id from public.client_packages where client_id = public.current_client_id()
    )
  );
create policy client_package_line_items_write on public.client_package_line_items
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- compliance_document_types: authenticated read active (staff read all); staff write.
create policy compliance_document_types_select on public.compliance_document_types
  for select to authenticated
  using (active or public.is_staff());
create policy compliance_document_types_write on public.compliance_document_types
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- onboarding_documents: client reads its own onboarding's checklist; staff all.
create policy onboarding_documents_select on public.onboarding_documents
  for select to authenticated
  using (
    public.is_staff()
    or onboarding_id in (
      select id from public.onboardings where client_id = public.current_client_id()
    )
  );
create policy onboarding_documents_write on public.onboarding_documents
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.onboardings to authenticated;
grant select, insert, update, delete on public.client_packages to authenticated;
grant select, insert, update, delete on public.client_package_line_items to authenticated;
grant select, insert, update, delete on public.compliance_document_types to authenticated;
grant select, insert, update, delete on public.onboarding_documents to authenticated;

grant all on public.clients to service_role;
grant all on public.onboardings to service_role;
grant all on public.client_packages to service_role;
grant all on public.client_package_line_items to service_role;
grant all on public.compliance_document_types to service_role;
grant all on public.onboarding_documents to service_role;

revoke execute on function public.current_client_id() from public;
grant execute on function public.current_client_id() to authenticated;
