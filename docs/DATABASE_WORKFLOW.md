# Database workflow

## Rules

- `supabase/migrations` is the schema source of truth.
- A committed migration does not change a database automatically.
- Never make schema changes directly in the Supabase dashboard.
- Never alter an applied migration. Create a corrective forward migration instead.
- Test every migration in staging before production exists or receives an equivalent approved change.

## Developer setup for migration work

Only developers assigned to database work need these steps.

1. Install the Supabase CLI and sign in with the company-approved Supabase account:

   ```powershell
   supabase login
   ```

2. Link the staging repository to the staging project:

   ```powershell
   cd blubook-staging
   pnpm supabase link --project-ref gluoosfypqbkspjmqpbs
   ```

   The CLI may request the staging database password. Retrieve it from the company password manager; never send it through chat or commit it to a file.

3. Create a clearly named immutable migration, test it locally, and regenerate types:

   ```powershell
   pnpm supabase migration new concise_change_name
   pnpm supabase db reset
   pnpm db:types:local
   ```

4. Include the migration, generated types, application changes, and tests in one PR.

5. After that PR is merged and reviewed, an authorized developer applies the exact migration to staging from current `main`:

   ```powershell
   pnpm supabase db push
   ```

6. QA tests the staging application and database change together.

The production database is intentionally not provisioned yet. Do not link this repository to the legacy database or copy the legacy schema. For detailed recovery and promotion rules, see [the migration runbook](runbooks/migration-runbook.md).
