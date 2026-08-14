-- Quotation documents are the client's alone.
--
-- A quotation is printed on the client's letterhead, which carries the bank
-- account, and the account is readable by nobody but the client. Filing a copy
-- into the archive quietly undid that: documents_select admits is_staff(), so
-- the details we refuse to show staff in one table were downloadable from
-- another.
--
-- Staff keep every other document in the archive. Only this category leaves
-- their reach, and only because of what is printed on it.

drop policy if exists documents_select on public.documents;

create policy documents_select on public.documents
  for select to authenticated
  using (
    (public.is_staff() and category <> 'quotation')
    or client_id = public.current_client_id()
    or id in (
      select rd.document_id
      from public.request_documents rd
      join public.service_requests sr on sr.id = rd.request_id
      where sr.provider_id = public.current_provider_id()
    )
    or id in (
      select f.document_id
      from public.document_filings f
      where f.owner_profile_id = (select auth.uid())
    )
  );

-- Reading is the point, but a document staff cannot read is one they should not
-- be able to retitle or remove either.

drop policy if exists documents_update on public.documents;

create policy documents_update on public.documents
  for update to authenticated
  using (
    (public.is_staff() and category <> 'quotation')
    or client_id = public.current_client_id()
  )
  with check (
    (public.is_staff() and category <> 'quotation')
    or client_id = public.current_client_id()
  );

drop policy if exists documents_delete on public.documents;

create policy documents_delete on public.documents
  for delete to authenticated
  using (
    (public.is_staff() and category <> 'quotation')
    or client_id = public.current_client_id()
  );
