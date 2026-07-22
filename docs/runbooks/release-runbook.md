# Release runbook

1. Confirm staging main is green and QA has approved an exact staging tag.
2. Create a production release branch from production main.
3. Merge the approved staging tag; do not copy individual files.
4. Review code and migrations, obtain production approval, and verify recovery readiness.
5. Run the controlled deployment, apply compatible migrations, and execute smoke tests.
6. Tag the production release, publish notes, and monitor critical paths.
