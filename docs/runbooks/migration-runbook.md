# Migration runbook

1. Create an immutable migration locally with the Supabase CLI.
2. Include schema, RLS policies, grants, indexes, and any safe backfill plan.
3. Run `supabase db reset`, schema tests, and `pnpm db:types:local`.
4. Commit the migration and generated types with the application change.
5. Merge and test in staging first.
6. Promote the exact QA-approved change to production.
7. For a failed production change, create a corrective forward migration through the same review and release process.
