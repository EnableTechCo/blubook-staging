-- Document archive categories
--
-- Filing structure for the document archive, so documents can be sorted by the
-- part of the business they belong to:
--
--   Sales Articles            -- Purchase Orders, Receipts, POD's
--   Human Resources Articles  -- Employment contracts, Essential HR Policies
--   Warehouse and Logistics
--   Finance
--   Legal
--
-- Modelled as reference data (not an enum) so staff can extend the taxonomy
-- without a migration, and so the two-level grouping is explicit. This is a
-- separate axis from documents.category, which records where a document came
-- from (compliance / generated / other).

create table public.document_categories (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid references public.document_categories (id) on delete cascade,
  slug       text not null unique,
  name       text not null,
  sort_order integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.document_categories is
  'Two-level filing taxonomy for the document archive; parent_id groups children under a section.';

create index document_categories_parent_idx on public.document_categories (parent_id);

create trigger document_categories_set_updated_at
  before update on public.document_categories
  for each row execute function public.set_updated_at();

-- Documents are filed against a category. Nullable so existing and
-- quick-uploaded documents remain valid; the UI files these under Uncategorised.
alter table public.documents
  add column category_id uuid references public.document_categories (id) on delete set null;

create index documents_category_id_idx on public.documents (category_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Shared reference data: any authenticated user reads active categories (staff
-- see all), and only staff maintain the taxonomy.

alter table public.document_categories enable row level security;

create policy document_categories_select on public.document_categories
  for select to authenticated
  using (active or public.is_staff());

create policy document_categories_write on public.document_categories
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

grant select, insert, update, delete on public.document_categories to authenticated;
grant all on public.document_categories to service_role;

-- ---------------------------------------------------------------------------
-- Seed the taxonomy
-- ---------------------------------------------------------------------------

insert into public.document_categories (slug, name, sort_order) values
  ('sales', 'Sales Articles', 10),
  ('human-resources', 'Human Resources Articles', 20),
  ('warehouse-logistics', 'Warehouse and Logistics', 30),
  ('finance', 'Finance', 40),
  ('legal', 'Legal', 50)
on conflict (slug) do nothing;

insert into public.document_categories (parent_id, slug, name, sort_order)
select p.id, v.slug, v.name, v.sort_order
from (values
  ('sales',           'purchase-orders',      'Purchase Orders',       10),
  ('sales',           'receipts',             'Receipts',              20),
  ('sales',           'proof-of-delivery',    'POD''s',                30),
  ('human-resources', 'employment-contracts', 'Employment contracts',  10),
  ('human-resources', 'hr-policies',          'Essential HR Policies', 20)
) as v (parent_slug, slug, name, sort_order)
join public.document_categories p on p.slug = v.parent_slug
on conflict (slug) do nothing;
