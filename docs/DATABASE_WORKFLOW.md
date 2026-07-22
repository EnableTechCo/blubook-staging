# Database guide

Only developers changing the database need this guide. There are no migration files yet.

## The simple rule

A migration is a dated SQL file that describes one database change. Git stores and reviews the file. Saving it in Git does not change Supabase by itself. An authorized developer applies an approved migration to staging after its PR merges.

Vercel is not used for database work. Local app queries use `.env.local`; migration work uses the Supabase CLI and authorized Supabase access.

## Rules that keep data safe

- `supabase/migrations` is the source of truth for database structure.
- Do not change tables, access rules, or permissions in the Supabase dashboard.
- Do not edit a migration that has already been applied. Add a new corrective migration.
- Do not connect this repository to the legacy database.
- Do not use real customer data in local seed data.

## First-time setup for migration work

```powershell
pnpm supabase login
pnpm supabase link --project-ref gluoosfypqbkspjmqpbs
```

The link command may ask for the staging database password. Get it from the company password manager. Never put it in a file, ticket, or chat message.

## Make a database change

1. Create a migration: `pnpm supabase migration new short_change_name`.
2. Add the database change, access rules, indexes, and any safe data-update steps needed.
3. Test locally and update generated types:

   ```powershell
   pnpm supabase db reset
   pnpm db:types:local
   ```

4. Put the migration, generated types, code, and tests in one PR.
5. After review and merge, an authorized developer on current staging `main` applies it:

   ```powershell
   pnpm supabase db push
   ```

6. QA tests the result in staging.

Production has not been created. Do not start a production database process until the legacy database has been exported and the new production environment exists.
