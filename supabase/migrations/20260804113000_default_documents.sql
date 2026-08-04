-- Default documents: the pack BluBook sends every new client
--
-- The inverse of compliance_document_types. That table lists what a client must
-- supply *to* BluBook during onboarding; this one holds what BluBook sends *to*
-- the client the moment they go live — terms, policies, guides. Providers will
-- supply the content in time; today staff maintain the library.
--
-- A template cannot live in public.documents, whose client_id is NOT NULL.
-- Onboarding copies each active template into a documents row owned by the new
-- client, so their copy is theirs to file, download and keep even after the
-- template is replaced or retired.

create table public.default_documents (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  description        text,
  storage_path       text not null,
  mime_type          text,
  size_bytes         bigint,
  -- Slug of the folder each client's copy is filed into, matched against their
  -- own tree. Null leaves the copy unfiled.
  target_folder_slug text,
  sort_order         integer not null default 0,
  active             boolean not null default true,
  created_by         uuid references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.default_documents is
  'Staff-maintained library of documents delivered to every client at onboarding.';
comment on column public.default_documents.target_folder_slug is
  'Folder slug in the receiving client''s own tree to file their copy into; null leaves it unfiled.';

create index default_documents_active_idx on public.default_documents (active, sort_order);

create trigger default_documents_set_updated_at
  before update on public.default_documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Staff only. Clients never read the library; they receive copies.

alter table public.default_documents enable row level security;

create policy default_documents_select on public.default_documents
  for select to authenticated
  using (public.is_staff());

create policy default_documents_write on public.default_documents
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

grant select, insert, update, delete on public.default_documents to authenticated;
grant all on public.default_documents to service_role;

-- ---------------------------------------------------------------------------
-- Delivery requests
-- ---------------------------------------------------------------------------
-- Each delivered document becomes its own system request, so it is individually
-- trackable and the client acknowledges each one. Adding the enum value here is
-- safe because nothing in this migration writes it — Postgres only forbids
-- using a new label in the transaction that adds it.

alter type public.request_type add value if not exists 'document_delivery';

-- The service these requests are raised against. Inactive so it stays out of
-- the client's service picker, and group-less so route_request can never match
-- a partner: BluBook delivers these itself.
insert into public.services (slug, name, description, active, group_id)
values (
  'blubook-document-delivery',
  'BluBook Document',
  'A document issued by BluBook to a client. Stays open until the client acknowledges receipt.',
  false,
  null
)
on conflict (slug) do nothing;
