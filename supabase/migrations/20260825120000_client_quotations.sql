-- Quotations the client issues to its own customers.
--
-- The line items are snapshotted from the product list, and that is the
-- opposite of what the letterhead does on purpose. A letterhead is a statement
-- about the client now, so it reads live and follows an address change. A
-- quotation is a statement about a price on a date, so it must not: if the
-- list is repriced next week, what was quoted last week has to keep saying what
-- it said.

create sequence if not exists public.quotation_reference_seq;

create table public.quotations (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients (id) on delete cascade,
  reference         text not null unique,

  -- Free-typed each time. The client's customers are not modelled here, and
  -- inventing a table for them would be inventing a CRM nobody asked for.
  recipient_name    text not null,
  recipient_company text,
  recipient_email   text,
  recipient_address text,

  issue_date        date not null default (timezone('Africa/Johannesburg', now()))::date,
  -- Thirty days by default, and stored rather than derived so a change to the
  -- default never moves the expiry of something already sent.
  expires_at        date not null,

  notes             text,

  subtotal          numeric(16, 2) not null default 0,
  vat_total         numeric(16, 2) not null default 0,
  total             numeric(16, 2) not null default 0,

  -- The filed PDF. Null only in the moment between the row and the upload.
  document_id       uuid references public.documents (id) on delete set null,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint quotations_recipient_not_blank check (btrim(recipient_name) <> ''),
  constraint quotations_expiry_after_issue check (expires_at >= issue_date)
);

create index quotations_client_issued_idx on public.quotations (client_id, issue_date desc);

create table public.quotation_items (
  id           uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,

  -- Copied, not referenced. The product may be repriced, renamed or withdrawn;
  -- the quotation still has to explain itself years later.
  product_code text not null,
  description  text not null,
  unit         text,
  quantity     numeric(12, 3) not null check (quantity > 0),
  unit_price   numeric(16, 2) not null check (unit_price >= 0),
  vat_rate     numeric(5, 2) not null default 15,
  line_total   numeric(16, 2) not null,

  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index quotation_items_quotation_idx on public.quotation_items (quotation_id, position);

create trigger quotations_set_updated_at
  before update on public.quotations
  for each row execute function public.set_updated_at();

/**
 * The reference, and the expiry when none was given.
 *
 * Assigned here rather than in the application so two quotations raised in the
 * same second cannot take the same number — the sequence settles it.
 */
create or replace function public.assign_quotation_reference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year text;
begin
  if nullif(btrim(new.reference), '') is null then
    v_year := to_char(timezone('Africa/Johannesburg', statement_timestamp()), 'YYYY');
    new.reference := 'QUO-' || v_year || '-' ||
      lpad(nextval('public.quotation_reference_seq')::text, 6, '0');
  end if;

  if new.expires_at is null then
    new.expires_at := new.issue_date + 30;
  end if;

  return new;
end;
$$;

create trigger quotations_assign_reference
  before insert on public.quotations
  for each row execute function public.assign_quotation_reference();

alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;

-- The client's own, like everything else it issues. No staff policy: a
-- quotation carries the client's prices to a named customer, and the letterhead
-- it is printed on carries the bank account.
create policy quotations_own on public.quotations
  for all to authenticated
  using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());

create policy quotation_items_own on public.quotation_items
  for all to authenticated
  using (
    quotation_id in (select id from public.quotations where client_id = public.current_client_id())
  )
  with check (
    quotation_id in (select id from public.quotations where client_id = public.current_client_id())
  );

grant select, insert, update, delete on public.quotations to authenticated;
grant select, insert, update, delete on public.quotation_items to authenticated;
grant all on public.quotations, public.quotation_items to service_role;
grant usage, select on sequence public.quotation_reference_seq to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Where the filed copy goes
-- ---------------------------------------------------------------------------
--
-- Under Sales, beside Purchase Orders, because that is where the archive
-- already keeps documents of this kind. Two changes rather than one: the
-- folder has to exist for clients onboarded before this migration, and the
-- seeder has to make it for everybody onboarded after. Doing only the backfill
-- is how a feature works for today's clients and quietly does not for next
-- week's.

insert into public.document_categories (owner_profile_id, parent_id, slug, name, sort_order)
select sales.owner_profile_id, sales.id, 'quotations', 'Quotations', 15
from public.document_categories sales
where sales.slug = 'sales'
  and not exists (
    select 1 from public.document_categories existing
    where existing.owner_profile_id = sales.owner_profile_id
      and existing.slug = 'quotations'
  );

create or replace function public.seed_default_folders(p_owner uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
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
    (p_owner, v_parent, 'quotations', 'Quotations', 15),
    (p_owner, v_parent, 'receipts', 'Receipts', 20),
    (p_owner, v_parent, 'proof-of-delivery', 'POD' || chr(39) || 's', 30);

  select id into v_parent from public.document_categories
    where owner_profile_id = p_owner and slug = 'human-resources';
  insert into public.document_categories (owner_profile_id, parent_id, slug, name, sort_order) values
    (p_owner, v_parent, 'employment-contracts', 'Employment contracts', 10),
    (p_owner, v_parent, 'hr-policies', 'Essential HR Policies', 20);
end;
$fn$;
