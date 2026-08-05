-- Link each onboarding to the dedicated request that collects its compliance
-- documents. The request remains optional because an onboarding can have no
-- active compliance document types.

alter table public.onboardings
  add column compliance_request_id uuid unique
    references public.service_requests (id) on delete set null;

comment on column public.onboardings.compliance_request_id is
  'System request through which the client submits documents for this onboarding checklist.';
