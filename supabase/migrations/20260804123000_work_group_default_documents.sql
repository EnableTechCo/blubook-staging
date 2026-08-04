-- Scope default documents to a work group
--
-- Some documents come from BluBook and go to everyone; others belong to a work
-- group and only apply to clients who actually bought that group's services.
-- A client on a Finance-only package has no use for the Warehouse group's
-- handling terms.
--
-- Which groups a client "has" is derived from the package they were onboarded
-- on: its line items resolve to services, and each service belongs to at most
-- one work group. Nothing is stored on the client, so the answer stays correct
-- if a service later moves between groups.

alter table public.default_documents
  add column work_group_id uuid references public.service_groups (id) on delete cascade;

comment on column public.default_documents.work_group_id is
  'Work group this document belongs to. Null means it is a BluBook document sent to every client; set means it is sent only to clients whose package includes a service in that group.';

create index default_documents_work_group_idx
  on public.default_documents (work_group_id);
