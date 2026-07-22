# Migration checklist

Use this only when a change needs a database migration.

1. Describe the database change and its safe forward-fix plan in the PR.
2. Create a new migration file. Never edit an applied one.
3. Include tables, access rules, permissions, indexes, and safe data-update steps.
4. Run `pnpm supabase db reset`, tests, and `pnpm db:types:local`.
5. Put the migration and generated types in the same PR as the application change.
6. Merge and apply it to staging only after review.
7. Let QA test the staging result.
8. When production exists, promote only the exact approved change.
