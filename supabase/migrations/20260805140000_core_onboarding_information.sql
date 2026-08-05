-- Expanded client onboarding information.
-- New submissions require these fields in the application. Most columns stay
-- nullable so historic clients are not backfilled with invented information.

create type public.client_entity_type as enum (
  'private_company', 'public_company', 'personal_liability_company',
  'non_profit_company', 'state_owned_company', 'close_corporation',
  'cooperative', 'trust', 'sole_proprietor', 'partnership', 'other'
);

create type public.vat_status as enum ('registered', 'not_registered', 'pending');

-- external_reference is the human-readable BluBook Customer ID. Retain any
-- imported identifiers and allocate a stable ID wherever one is absent.
create sequence public.client_customer_id_seq;

select setval(
  'public.client_customer_id_seq',
  coalesce(
    (select max(substring(external_reference from '^CUS-([0-9]+)$')::bigint)
     from public.clients
     where external_reference ~ '^CUS-[0-9]+$'),
    0
  ) + 1,
  false
);

alter table public.clients
  alter column external_reference set default
    ('CUS-' || lpad(nextval('public.client_customer_id_seq')::text, 6, '0'));

update public.clients
set external_reference = 'CUS-' || lpad(nextval('public.client_customer_id_seq')::text, 6, '0')
where external_reference is null;

alter table public.clients alter column external_reference set not null;

comment on column public.clients.external_reference is
  'Human-readable BluBook Customer ID, generated automatically for new accounts.';

alter table public.clients
  add column registered_name text,
  add column trading_name text,
  add column entity_type public.client_entity_type,
  add column registration_number text,
  add column industry text,
  add column primary_contact_job_title text,
  add column primary_contact_phone text,
  add column billing_contact_name text,
  add column billing_contact_email text,
  add column business_address_line_1 text,
  add column business_address_line_2 text,
  add column business_city text,
  add column business_province text,
  add column business_postal_code text,
  add column business_country text default 'South Africa',
  add column billing_address_line_1 text,
  add column billing_address_line_2 text,
  add column billing_city text,
  add column billing_province text,
  add column billing_postal_code text,
  add column billing_country text default 'South Africa',
  add column vat_status public.vat_status,
  add column vat_number text,
  add constraint clients_registered_vat_number check (
    vat_status is distinct from 'registered'
    or nullif(btrim(vat_number), '') is not null
  );

-- With no separate historic legal/trading names, preserve the current display
-- name in both fields. New accounts use trading_name as business_name.
update public.clients
set registered_name = business_name,
    trading_name = business_name
where registered_name is null or trading_name is null;

alter table public.clients
  alter column registered_name set not null,
  alter column trading_name set not null;

comment on column public.clients.business_name is
  'Display name retained for compatibility; new accounts use the trading name.';
comment on column public.clients.registered_name is
  'Legal name of the entity as registered with the relevant authority.';
comment on column public.clients.registration_number is
  'CIPC registration number or equivalent entity reference, when applicable.';
comment on column public.clients.vat_number is
  'South African VAT registration number; required when VAT status is registered.';

alter table public.client_packages
  add column service_commencement_date date;

update public.client_packages
set service_commencement_date = created_at::date
where service_commencement_date is null;

alter table public.client_packages
  alter column service_commencement_date set default current_date,
  alter column service_commencement_date set not null;

comment on column public.client_packages.service_commencement_date is
  'Date the purchased service package became active; assigned automatically.';
