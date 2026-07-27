-- Document management (system #8)
--
-- A single document archive owned per client. Holds compliance documents
-- captured at onboarding and documents generated thereafter, tracks validity
-- and expiry, and links documents to service requests.
--
-- Anonymity: a provider may only see documents explicitly attached to a request
-- assigned to them (via request_documents, which only staff/the system write).
-- A client's compliance/identity documents are never auto-exposed to providers.
--
-- File bytes live in a private Supabase Storage bucket ('documents'); all access
-- is mediated server-side (service role) after an RLS-scoped permission check,
-- so the rules below are the single source of truth for who sees what.
--
-- Reuses is_staff(), current_client_id(), current_provider_id(), set_updated_at().

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------

create type public.document_category as enum ('compliance', 'generated', 'other');

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------

create table public.documents (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references public.clients (id) on delete cascade,
  uploaded_by           uuid references public.profiles (id) on delete set null,
  category              public.document_category not null default 'other',
  document_type_id      uuid references public.compliance_document_types (id) on delete set null,
  -- Optional link to the onboarding checklist item this document satisfies.
  onboarding_document_id uuid references public.onboarding_documents (id) on delete set null,
  title                 text not null,
  storage_path          text not null unique,
  mime_type             text,
  size_bytes            bigint,
  issued_at             date,
  expires_at            date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.documents is
  'Per-client document archive; file bytes live in the private documents bucket.';

create index documents_client_id_idx on public.documents (client_id);
create index documents_expires_at_idx on public.documents (expires_at);

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- request_documents
-- ---------------------------------------------------------------------------
-- Which documents are attached to which service requests. Only staff/system
-- write here, so identifying documents are never silently exposed to providers.

create table public.request_documents (
  request_id  uuid not null references public.service_requests (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (request_id, document_id)
);

comment on table public.request_documents is
  'Documents attached to service requests; the only path by which a provider sees a document.';

create index request_documents_document_id_idx on public.request_documents (document_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.documents enable row level security;
alter table public.request_documents enable row level security;

-- documents: staff all; a client its own; a provider only documents attached to
-- a request assigned to it.
create policy documents_select on public.documents
  for select to authenticated
  using (
    public.is_staff()
    or client_id = public.current_client_id()
    or id in (
      select rd.document_id
      from public.request_documents rd
      join public.service_requests sr on sr.id = rd.request_id
      where sr.provider_id = public.current_provider_id()
    )
  );

create policy documents_insert on public.documents
  for insert to authenticated
  with check (public.is_staff() or client_id = public.current_client_id());

create policy documents_update on public.documents
  for update to authenticated
  using (public.is_staff() or client_id = public.current_client_id())
  with check (public.is_staff() or client_id = public.current_client_id());

create policy documents_delete on public.documents
  for delete to authenticated
  using (public.is_staff() or client_id = public.current_client_id());

-- request_documents: readable when the request is visible to the caller;
-- writable only by staff (auto-linking runs via the service role).
create policy request_documents_select on public.request_documents
  for select to authenticated
  using (
    public.is_staff()
    or request_id in (select id from public.service_requests)
  );

create policy request_documents_write on public.request_documents
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.request_documents to authenticated;
grant all on public.documents to service_role;
grant all on public.request_documents to service_role;

-- ---------------------------------------------------------------------------
-- Storage: private documents bucket
-- ---------------------------------------------------------------------------
-- Private. No storage.objects policies are granted to end users; all uploads
-- and downloads are mediated by server code using the service role after an
-- RLS-scoped check against the documents table above.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
