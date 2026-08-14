-- The client's own product list: what the client sells to its customers.
--
-- Deliberately not the catalogue. public.line_items and public.packages are
-- what BluBook sells, priced by sales admin. These are the client's products at
-- the client's prices, and putting them in the same table would hand a staff
-- role control over a client's pricing.
--
-- Uploaded as a spreadsheet and parsed into rows rather than kept as a file,
-- because a quotation has to pick lines off it, total them, and carry the
-- figure into the pipeline. A stored attachment cannot do any of that.

create table public.client_products (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients (id) on delete cascade,

  product_code text not null,
  description  text not null,
  unit         text,
  unit_price   numeric(16, 2) not null default 0 check (unit_price >= 0),
  -- A percentage, not a multiplier: 15 means 15%. Nullable would invite the
  -- question "no VAT, or unknown VAT?" on every quotation total.
  vat_rate     numeric(5, 2) not null default 15
                 check (vat_rate >= 0 and vat_rate <= 100),
  category     text,

  -- Withdrawn products stay on the row so past quotations still explain
  -- themselves. Only active ones are offered when building a new one.
  active       boolean not null default true,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- The code is how a re-upload finds the row it is replacing, so it has to be
  -- unique within the client and cannot be blank.
  constraint client_products_code_not_blank check (btrim(product_code) <> ''),
  constraint client_products_description_not_blank check (btrim(description) <> ''),
  unique (client_id, product_code)
);

create index client_products_client_active_idx
  on public.client_products (client_id, active);

create trigger client_products_set_updated_at
  before update on public.client_products
  for each row execute function public.set_updated_at();

alter table public.client_products enable row level security;

-- The client owns this list and maintains it from its own workspace.
create policy client_products_client_all on public.client_products
  for all to authenticated
  using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());

-- Staff read it because it is part of the client's record, the same as the
-- rest of that record: everyone reads, operations writes. Operations needs the
-- write because it is operations that uploads the first list during onboarding.
create policy client_products_staff_select on public.client_products
  for select to authenticated
  using (public.is_staff());

create policy client_products_staff_write on public.client_products
  for all to authenticated
  using (public.has_staff_role('operations'))
  with check (public.has_staff_role('operations'));

-- No partner policy at all. A partner has no business reading what a client
-- sells, and quotations never reach one.

grant select, insert, update, delete on public.client_products to authenticated;
grant all on public.client_products to service_role;

comment on table public.client_products is
  'The client''s own products, at the client''s prices. Not the BluBook catalogue.';
