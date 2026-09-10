-- Work-group intake, captured at onboarding.
--
-- Onboarding is now a wizard with one stage per work group the client's
-- package draws on, and each stage asks that group's baseline questions: what
-- Finance needs to know before the first month-end, what Tender Services
-- needs before the first bid, and so on. The questions are still being settled
-- with the groups themselves, so the answers are stored as a JSON document per
-- (client, work group) rather than as columns. A group can change its questions
-- without a migration, and an answer set written last month stays readable
-- under the labels it was written with.
--
-- Staff capture it and staff read it. The client can read its own — it is the
-- client's information — and no partner policy exists: the anonymity rule holds
-- here as everywhere. When a group's partner needs a fact from the intake, it
-- reaches them through the request that needs it, not by reading the record.

create table public.client_work_group_intake (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients (id) on delete cascade,
  service_group_id uuid not null references public.service_groups (id) on delete cascade,

  -- The stage's answers, keyed by the field key the intake specification
  -- defines. Free-form on purpose; see the header.
  answers          jsonb not null default '{}'::jsonb,

  captured_by      uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint client_work_group_intake_one_per_group unique (client_id, service_group_id),
  constraint client_work_group_intake_answers_is_object check (jsonb_typeof(answers) = 'object')
);

comment on table public.client_work_group_intake is
  'Baseline answers a work group needs about a client, captured at onboarding. One document per (client, work group); staff-written, client-readable, invisible to partners.';
comment on column public.client_work_group_intake.answers is
  'Field key to answer, as the intake specification in the application defines the keys. Stored loosely so a group can change its questions without a migration.';

create index client_work_group_intake_client_idx
  on public.client_work_group_intake (client_id);

create trigger client_work_group_intake_set_updated_at
  before update on public.client_work_group_intake
  for each row execute function public.set_updated_at();

alter table public.client_work_group_intake enable row level security;

-- Staff capture and maintain it.
create policy client_work_group_intake_staff_all on public.client_work_group_intake
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- The client reads what was recorded about it.
create policy client_work_group_intake_client_select on public.client_work_group_intake
  for select to authenticated
  using (client_id = public.current_client_id());

-- No partner policy. See the header.

grant select, insert, update, delete on public.client_work_group_intake to authenticated;
grant all on public.client_work_group_intake to service_role;
