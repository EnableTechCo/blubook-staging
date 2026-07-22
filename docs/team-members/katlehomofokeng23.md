# Katleho Mofokeng

## Your role

You are a developer and may work on staging migrations. You have GitHub Admin access to the staging repository and Supabase Developer access to the staging project.

## First setup

Follow [Set up a developer computer](../TEAM_SETUP.md). Create your own `.env.local` from the template and use the staging Supabase URL and anon key stored for developers in the company password manager. You do not need a Vercel account or Vercel keys.

## Every change

1. Create a branch for one piece of work.
2. Test it locally.
3. Run `pnpm check` and `pnpm build`.
4. Open a PR and use its preview link.
5. Wait for another qualified account to review before merging.

Read [How changes reach staging](../GIT_WORKFLOW.md) for the full process.

## Database changes

Read [Database guide](../DATABASE_WORKFLOW.md) first. Your Supabase Developer role is for database work, not project settings. Ask the company owner for settings changes and never share the database password.
