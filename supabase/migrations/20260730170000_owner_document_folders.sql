-- Per-owner document folders
--
-- The archive filing taxonomy was global reference data only staff could edit.
-- Clients and partners now own and customise their own two-level folder tree,
-- private to them (staff included). Filing is per-owner too: a partner files the
-- documents shared with it into its own tree, independently of how the client
-- filed the same document. The old single documents.category_id is replaced by
-- document_filings, keyed by (document, owner).

-- ---------------------------------------------------------------------------
-- 1. Folders gain an owner
-- ---------------------------------------------------------------------------

alter table public.document_categories
  add column owner_profile_id uuid references public.profiles (id) on delete cascade;

comment on column public.document_categories.owner_profile_id is
  'The profile that owns this folder. Folders are private to their owner.';

-- slug was globally unique; it is now unique within an owner's own tree.
alter table public.document_categories drop constraint document_categories_slug_key;
create unique index document_categories_owner_slug_key
  on public.document_categories (owner_profile_id, slug);

-- ---------------------------------------------------------------------------
-- 2. Per-owner filing
-- ---------------------------------------------------------------------------

create table public.document_filings (
  document_id      uuid not null references public.documents (id) on delete cascade,
  owner_profile_id uuid not null references public.profiles (id) on delete cascade,
  category_id      uuid not null references public.document_categories (id) on delete cascade,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (document_id, owner_profile_id)
);

comment on table public.document_filings is
  'Where each owner has filed a document within their own folder tree.';

create index document_filings_category_idx on public.document_filings (category_id);
create index document_filings_owner_idx on public.document_filings (owner_profile_id);

create trigger document_filings_set_updated_at
  before update on public.document_filings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Default folder seeding
-- ---------------------------------------------------------------------------
-- The taxonomy from the archive design, created per owner so it can then be
-- freely renamed, extended or removed. Idempotent: skips an owner that already
-- has folders.

create or replace function public.seed_default_folders(p_owner uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent uuid;
begin
  if exists (select 1 from public.document_categories where owner_profile_id = p_owner) then
    return;
  end if;

  insert into public.document_categories (owner_profile_id, slug, name, sort_order) values
    (p_owner, 'sales', 'Sales Articles', 10),
    (p_owner, 'human-resources', 'Human Resources Articles', 20),
    (p_owner, 'warehouse-logistics', 'Warehouse and Logistics', 30),
    (p_owner, 'finance', 'Finance', 40),
    (p_owner, 'legal', 'Legal', 50);

  select id into v_parent from public.document_categories
    where owner_profile_id = p_owner and slug = 'sales';
  insert into public.document_categories (owner_profile_id, parent_id, slug, name, sort_order) values
    (p_owner, v_parent, 'purchase-orders', 'Purchase Orders', 10),
    (p_owner, v_parent, 'receipts', 'Receipts', 20),
    (p_owner, v_parent, 'proof-of-delivery', 'POD''s', 30);

  select id into v_parent from public.document_categories
    where owner_profile_id = p_owner and slug = 'human-resources';
  insert into public.document_categories (owner_profile_id, parent_id, slug, name, sort_order) values
    (p_owner, v_parent, 'employment-contracts', 'Employment contracts', 10),
    (p_owner, v_parent, 'hr-policies', 'Essential HR Policies', 20);
end;
$$;

-- New clients and partners get the default tree the moment their profile exists.
create or replace function public.seed_folders_for_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_type in ('client', 'service_provider') then
    perform public.seed_default_folders(new.id);
  end if;
  return new;
end;
$$;

create trigger profiles_seed_folders
  after insert on public.profiles
  for each row execute function public.seed_folders_for_profile();

-- ---------------------------------------------------------------------------
-- 4. Backfill existing owners and migrate existing filings
-- ---------------------------------------------------------------------------

do $$
declare r record;
begin
  for r in select id from public.profiles where user_type in ('client', 'service_provider')
  loop
    perform public.seed_default_folders(r.id);
  end loop;
end $$;

-- Move each client's existing document.category_id onto their own copy of the
-- matching folder (by slug), as a filing owned by the client.
insert into public.document_filings (document_id, owner_profile_id, category_id)
select d.id, c.primary_profile_id, mine.id
from public.documents d
join public.document_categories old on old.id = d.category_id
join public.clients c on c.id = d.client_id
join public.document_categories mine
  on mine.owner_profile_id = c.primary_profile_id and mine.slug = old.slug
where d.category_id is not null
  and c.primary_profile_id is not null
on conflict do nothing;

-- Retire the global taxonomy and the single-category column it fed.
delete from public.document_categories where owner_profile_id is null;

alter table public.document_categories
  alter column owner_profile_id set not null;

alter table public.documents drop column category_id;

-- ---------------------------------------------------------------------------
-- 5. Row level security
-- ---------------------------------------------------------------------------
-- Folders and filings are private to their owner — staff included.

drop policy document_categories_select on public.document_categories;
drop policy document_categories_write on public.document_categories;

create policy document_categories_select on public.document_categories
  for select to authenticated
  using (owner_profile_id = (select auth.uid()));

create policy document_categories_write on public.document_categories
  for all to authenticated
  using (owner_profile_id = (select auth.uid()))
  with check (owner_profile_id = (select auth.uid()));

alter table public.document_filings enable row level security;

create policy document_filings_select on public.document_filings
  for select to authenticated
  using (owner_profile_id = (select auth.uid()));

-- An owner may only file documents they can see, into their own folders. The
-- documents subquery is subject to documents' own RLS, so visibility is enforced.
create policy document_filings_write on public.document_filings
  for all to authenticated
  using (owner_profile_id = (select auth.uid()))
  with check (
    owner_profile_id = (select auth.uid())
    and exists (select 1 from public.documents d where d.id = document_id)
    and exists (
      select 1 from public.document_categories c
      where c.id = category_id and c.owner_profile_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.document_filings to authenticated;
grant all on public.document_filings to service_role;
