# Katleho Mofokeng — development and migrations

## Your access and role

You have GitHub Admin access to `EnableTechCo/blubook-staging` and Supabase Developer access for the staging project. You develop features, review another developer's PRs, manage approved repository settings, and may merge approved work.

## First local setup

Follow [the shared setup guide](../TEAM_SETUP.md). Sign in to Vercel with your company-approved account and run `vercel env pull .env.local --environment=production --scope enable-tech` from the linked staging repository.

If you cannot access Vercel, request access to the Enable Tech team and the `blubook-staging` project. Do not receive environment values through chat.

## Database work

Follow [the database workflow](../DATABASE_WORKFLOW.md). Your Supabase Developer role supports database content work but not project settings; request the company owner for settings changes. Use the company password manager for the staging database password and never share it.

## Every change

Create a focused branch, run `pnpm check` and `pnpm build`, open a PR, use the preview for review, and obtain a different qualified account's approval before merging. See [the Git workflow](../GIT_WORKFLOW.md).
