# Matisse Ops — development and migrations

## Your access and role

You have GitHub Write access to `EnableTechCo/blubook-staging`. You develop features, review another developer's PRs, and may merge approved work. You are also one of the authorized developers for staging migrations.

## First local setup

Follow [the shared setup guide](../TEAM_SETUP.md). Sign in to Vercel with your company-approved account and run `vercel env pull .env.local --environment=production --scope enable-tech` from the linked staging repository.

If Vercel denies access, request membership of the Enable Tech team and the `blubook-staging` project. Do not ask anyone to message you environment values.

## Database work

Follow [the database workflow](../DATABASE_WORKFLOW.md) before creating or applying a migration. Retrieve the staging database password only from the company password manager. Apply migrations only from reviewed, current staging `main`.

## Every change

Create a focused branch, run `pnpm check` and `pnpm build`, open a PR, use the preview for review, and obtain a different qualified account's approval before merging. See [the Git workflow](../GIT_WORKFLOW.md).
