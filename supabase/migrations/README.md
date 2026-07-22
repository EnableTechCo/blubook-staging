# Migrations

Migration files are immutable and are the exclusive authority for application schema, RLS policies, grants, indexes, and database functions.

Create a migration using `supabase migration new <description>`. Validate it with `supabase db reset` before review. Never make a schema change directly in a hosted Supabase dashboard.
