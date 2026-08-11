-- Client compliance contact
--
-- The Weighted Compliance Ratio notification is copied to the client's
-- Compliance Manager, also called their Business Coach. That person is not
-- necessarily a BluBook user and not necessarily the client's primary or
-- billing contact, so they need their own fields rather than reusing either.
--
-- Both are nullable: clients onboarded before this point have no coach on
-- record, and the weekly copy is simply skipped for them rather than failing.

alter table public.clients
  add column if not exists compliance_manager_name text
    check (compliance_manager_name is null or btrim(compliance_manager_name) <> ''),
  add column if not exists compliance_manager_email text
    check (compliance_manager_email is null or compliance_manager_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

comment on column public.clients.compliance_manager_name is
  'Compliance Manager / Business Coach for the account. Addressed in the weekly compliance email.';

comment on column public.clients.compliance_manager_email is
  'Where the weekly Weighted Compliance Ratio notification is copied. Null means no copy is sent.';
