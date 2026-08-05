-- nextval() on a sequence is authorized separately from inserts on the table
-- that uses it as a default. Staff onboarding currently writes through the
-- service-role client; authenticated is included for any future RLS-backed
-- client creation path.

grant usage on sequence public.client_customer_id_seq to authenticated, service_role;
