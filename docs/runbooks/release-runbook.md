# Future production release guide

Production does not exist yet, so do not use this guide today.

When production is ready:

1. Confirm staging checks are green and QA has approved the exact change.
2. Create a production release branch from production `main`.
3. Bring across the approved change as one traceable release. Do not copy files by hand.
4. Review code, migrations, recovery plan, and production approval.
5. Deploy, apply compatible migrations, and perform smoke tests.
6. Record the release using the [release record](../releases/release-manifest-template.md), tag it, and monitor the result.
