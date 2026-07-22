# BluBook staging

This is the clean technical foundation for the new BluBook system. It is intentionally separate from the legacy `project-blubook` application.

## What is ready today

- A Next.js application with a simple foundation page.
- A health check at `/api/health`.
- A separate staging GitHub repository, Supabase project, and Vercel project.
- Automated pull-request checks and preview deployments.
- An empty migration folder ready for future approved database changes.

There are **no client workflows, legacy data, legacy schema, business rules, or production services** in this repository.

## Start here

Choose the guide that matches what you need to do:

- [Set up a developer computer](docs/TEAM_SETUP.md)
- [Understand branches, reviews, and merges](docs/GIT_WORKFLOW.md)
- [Work safely with the staging database](docs/DATABASE_WORKFLOW.md)
- [Test a change as QA](docs/QA_WORKFLOW.md)
- [Read your role-specific guide](docs/team-members/README.md)

## Important safety rules

- Work in `blubook-staging`. Do not modify the legacy project.
- Never commit `.env.local`, passwords, service-role keys, or Vercel tokens.
- Do not push directly to `main`.
- Do not make database changes in the Supabase dashboard. Use reviewed migration files.
- Do not create release tags or production releases yet. Production infrastructure is intentionally deferred.

## Developer commands

After Git, Node.js, and pnpm are installed on a computer:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm install --frozen-lockfile` installs every BluBook package together. It does not install computer tools such as Git or Node.js; see the [setup guide](docs/TEAM_SETUP.md) for those one-time requirements.

Before opening a pull request, run:

```powershell
pnpm check
pnpm build
```
