-- Service catalogue (system #3)
--
-- Owns the master definition of every service, line item, and package. Line
-- items are first-class records (service requests are auto-generated from them)
-- and carry a tier and their own price. Standard packages (Basic / Intermediate
-- / Professional) are curated bundles of line items with a single set price.
-- Flex packages are assembled per-client during onboarding from these line
-- items; their composition rules live in application logic, so nothing here
-- constrains which line items may combine.
--
-- Reference data: readable by any authenticated user (active rows), writable
-- only by staff. Reuses is_staff() and set_updated_at() from the identity
-- migration.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- Tier a line item belongs to. Standard packages are built per tier, and Flex
-- composition rules reference these levels ("line items from higher tiers").
create type public.service_tier as enum ('basic', 'intermediate', 'professional');

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
-- The canonical list of service types. Routing matches requests to providers by
-- service, and the provider registry declares capabilities against these.

create table public.services (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null unique,
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.services is
  'Canonical service types; matched on by routing and the provider registry.';

-- ---------------------------------------------------------------------------
-- line_items
-- ---------------------------------------------------------------------------
-- First-class deliverables within a service. Service requests are generated from
-- these, so they must exist as records rather than free text. Each carries a
-- tier and its own price (the price used when composed into a Flex package).

create table public.line_items (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references public.services (id) on delete restrict,
  name        text not null,
  description text,
  tier        public.service_tier not null,
  price       numeric(12, 2) not null default 0 check (price >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (service_id, name)
);

comment on table public.line_items is
  'First-class service deliverables; requests are auto-generated from these.';

create index line_items_service_id_idx on public.line_items (service_id);
create index line_items_tier_idx on public.line_items (tier);

-- ---------------------------------------------------------------------------
-- packages
-- ---------------------------------------------------------------------------
-- Standard tier packages: a curated bundle of line items sold at a single set
-- price. One row per offered standard package (typically one per tier, but the
-- schema does not force exactly three).

create table public.packages (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  tier        public.service_tier not null,
  price       numeric(12, 2) not null check (price >= 0),
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.packages is
  'Standard tier packages: curated line-item bundles with a set price. Flex packages are assembled per-client in onboarding, not stored here.';

create index packages_tier_idx on public.packages (tier);

-- ---------------------------------------------------------------------------
-- package_line_items
-- ---------------------------------------------------------------------------
-- Which line items make up each standard package.

create table public.package_line_items (
  package_id   uuid not null references public.packages (id) on delete cascade,
  line_item_id uuid not null references public.line_items (id) on delete restrict,
  quantity     integer not null default 1 check (quantity > 0),
  created_at   timestamptz not null default now(),
  primary key (package_id, line_item_id)
);

comment on table public.package_line_items is
  'Composition of standard packages: the line items each package bundles.';

create index package_line_items_line_item_id_idx
  on public.package_line_items (line_item_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance (reuses public.set_updated_at from the identity migration)
-- ---------------------------------------------------------------------------

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

create trigger line_items_set_updated_at
  before update on public.line_items
  for each row execute function public.set_updated_at();

create trigger packages_set_updated_at
  before update on public.packages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Catalogue is shared reference data: any authenticated user may read active
-- rows (staff also see inactive/draft rows); only staff may write.

alter table public.services enable row level security;
alter table public.line_items enable row level security;
alter table public.packages enable row level security;
alter table public.package_line_items enable row level security;

-- services
create policy services_select on public.services
  for select to authenticated
  using (active or public.is_staff());
create policy services_write on public.services
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- line_items
create policy line_items_select on public.line_items
  for select to authenticated
  using (active or public.is_staff());
create policy line_items_write on public.line_items
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- packages
create policy packages_select on public.packages
  for select to authenticated
  using (active or public.is_staff());
create policy packages_write on public.packages
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- package_line_items: readable by any authenticated user; writable by staff.
create policy package_line_items_select on public.package_line_items
  for select to authenticated
  using (true);
create policy package_line_items_write on public.package_line_items
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.line_items to authenticated;
grant select, insert, update, delete on public.packages to authenticated;
grant select, insert, update, delete on public.package_line_items to authenticated;

grant all on public.services to service_role;
grant all on public.line_items to service_role;
grant all on public.packages to service_role;
grant all on public.package_line_items to service_role;
