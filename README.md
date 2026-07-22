# BluBook

Clean Next.js and Supabase platform foundation for the rebuilt BluBook application.

The repository intentionally contains no legacy workflow, routes, schema, business rules, client requirements, or production data.

## Local setup

1. Install Node.js 22+ and pnpm 9.15.9+.
2. Copy `.env.example` to `.env.local` and enter local Supabase values.
3. Run `pnpm install`.
4. Run `pnpm dev`.

## Checks

Run `pnpm check`, then `pnpm build`. End-to-end tests are run with `pnpm test:e2e`.

## Database

`supabase/migrations` is the sole schema authority. Create immutable migrations with the Supabase CLI, rebuild locally with `supabase db reset`, and regenerate database types before merging a schema change.

Do not add feature dependencies or product functionality until they are separately approved.

## Team guides

- [Shared local setup](docs/TEAM_SETUP.md)
- [Git workflow](docs/GIT_WORKFLOW.md)
- [Database workflow](docs/DATABASE_WORKFLOW.md)
- [QA workflow](docs/QA_WORKFLOW.md)
- [Role-specific onboarding](docs/team-members/README.md)
