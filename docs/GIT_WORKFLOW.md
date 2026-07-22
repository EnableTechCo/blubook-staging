# How changes reach staging

GitHub keeps `main` protected so that one accidental change cannot break the shared staging environment.

## The simple flow

1. Start from an up-to-date `main` branch.
2. Create a new branch for one piece of work, such as `feature/login-screen`.
3. Make the change and test it locally.
4. Open a pull request (PR) into `main`.
5. GitHub runs the automated `quality` check and posts an automatic preview link.
6. A reviewer and QA check the change.
7. After approval and passing checks, an authorized developer merges the PR into staging `main`.

Never push straight to `main`, force-push, or bypass the PR process.

## Create a branch

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/short-description
```

Before opening the PR, run:

```powershell
pnpm check
pnpm build
```

## Who does what

| Person | GitHub access | What they do |
| --- | --- | --- |
| Matisse Ops | Write | Build changes, review, and merge approved PRs. |
| Katleho Mofokeng | Admin | Build changes, review, manage approved repository settings, and merge approved PRs. |
| Ndzalo | Read | Test previews and staging, then record QA feedback. |
| Ntokozo | Read | Review the user experience and design in previews, then record feedback. |

`main` requires one technical approval from an account with the needed repository permission, the passing `quality` check, resolved conversation threads, and linear history. The person who opened the PR should not be the only reviewer.

## What happens after merge

Merging into staging `main` deploys the staging application automatically. Team members do not need Vercel accounts or keys. A merge does not change a Supabase database unless an authorized developer separately applies a reviewed migration. See [Database workflow](DATABASE_WORKFLOW.md).

Do not create release tags or production releases yet. Production infrastructure does not exist yet.
