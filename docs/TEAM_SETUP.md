# Set up a developer computer

This guide is for developers working on the staging repository. QA and UX do not need to complete it.

## What you need

- GitHub access to `EnableTechCo/blubook-staging`.
- Git, Node.js 22 or newer, and pnpm 9.15.9 or newer installed on your computer.
- The staging Supabase URL and anon key from the company password manager.
- Supabase project access only if you will create or apply database migrations.

You do not need a Vercel account, Vercel keys, or the Vercel CLI. GitHub automatically triggers the staging deployment after approved work merges.

## Set up the code

Run these commands once:

```powershell
git clone https://github.com/EnableTechCo/blubook-staging.git
cd blubook-staging
pnpm install --frozen-lockfile
```

The last command installs every BluBook package together. You do not install React, Next.js, Supabase, or test packages one by one.

## Create your private local environment file

Create your own local file from the template:

```powershell
Copy-Item .env.example .env.local
```

In `.env.local`, keep these local values:

```text
NEXT_PUBLIC_APP_NAME=BluBook
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=local
```

Then copy the following two staging values from the company password manager into the matching lines in your `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=<staging Supabase URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging anon key>
```

Do not fill in `SUPABASE_SERVICE_ROLE_KEY`. It is not needed for normal local development and must never be shared with the team.

`.env.local` is private and ignored by Git. Never commit it, email it, paste it into chat, or add real values to documentation.

## Start and test the app

```powershell
pnpm dev
```

The local app can query and edit staging data only where the Supabase access rules allow it. Database structure changes use reviewed migrations; see [Database guide](DATABASE_WORKFLOW.md).

Before opening a pull request, run:

```powershell
pnpm check
pnpm build
```

If you need GitHub or Supabase access, ask the company owner to grant it to your own account. Do not use another person's login or credentials.
