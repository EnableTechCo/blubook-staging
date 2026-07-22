# Git workflow

## Branches and pull requests

`main` is protected. Do not push directly to it.

1. Update local `main` and create a focused branch, for example `feature/customer-import` or `fix/login-redirect`.
2. Make one coherent change, including tests, migration files, and generated database types when applicable.
3. Run `pnpm check` and `pnpm build`.
4. Push the branch and open a normal pull request into `main`.
5. Use the Vercel preview deployment for review and QA.
6. Resolve review comments and wait for the required `quality` check to pass.
7. A different account with the required repository permission approves the PR before merge.

The protected `main` branch requires one approval, the `quality` check, resolved conversations, and linear history. Do not force-push or bypass branch protection.

## Roles

| Team member | GitHub role | Workflow responsibility |
| --- | --- | --- |
| `matisse-ops` | Write | Develop, review, and merge approved work. |
| `katlehomofokeng23` | Admin | Develop, review, manage repository settings, and merge approved work. |
| `Ndzalo-gvphx` | Read | Test previews/staging and give QA feedback. |
| `ntokozo632` | Read | Review UX/UI in previews and give design feedback. |

QA and UX feedback is required operationally when requested, but read-only GitHub access cannot satisfy the protected approval requirement.

## Releases

Work is merged into staging `main` after review and QA. Do not create release tags or promote work to production until the separate production Supabase and hosting environments exist. See [the release runbook](runbooks/release-runbook.md) when production is ready.
