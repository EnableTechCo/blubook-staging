# QA guide

QA checks that a proposed change works before it becomes part of shared staging.

## What you need

- A GitHub account with access to the staging repository.
- The pull request link from the developer.
- The expected result or acceptance criteria for the change.

You do **not** need environment variables, a database password, Supabase access, or Vercel access. Do not request or store them.

## Test a pull request

1. Open the pull request in GitHub.
2. Wait for its automatic preview link and automated checks.
3. Open the preview link and test the expected result.
4. Also check nearby behaviour that could have been affected, including errors and mobile/desktop layout where relevant.
5. Add clear feedback to the PR. For a problem, include what you did, what happened, what you expected, and a screenshot or recording where helpful.
6. When a fix is provided, test the updated preview again.

## Record the outcome

Use a short, clear PR comment:

- **QA approved:** what you tested and which preview was used.
- **Blocked:** the exact problem and how to reproduce it.
- **Approved with follow-up:** what works now and what should be tracked separately.

QA feedback is the test record. A developer with Write or Admin access provides the technical GitHub approval required to merge.
