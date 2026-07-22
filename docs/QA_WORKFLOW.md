# QA workflow

## What to test

QA tests work after it is deployed to a pull-request preview and, after merge, to the shared staging URL. Test the stated acceptance criteria, regressions around the changed area, error handling, and the relevant browser/device behavior.

## Workflow

1. Open the pull request in GitHub and use its Vercel preview link.
2. Test against the acceptance criteria supplied with the PR.
3. Record defects or questions as GitHub review comments or issue links, with clear reproduction steps and screenshots where useful.
4. Retest fixes on the updated preview.
5. State the QA outcome in the PR discussion: approved for staging, blocked, or approved with follow-up work.
6. After merge, smoke-test the shared staging URL if the change warrants it.

QA does not need environment variables, Supabase credentials, Vercel credentials, or direct database access. Do not request or store them.

GitHub branch protection requires a write/admin approval to merge. QA's read-only review is the testing record, not the technical merge approval.
