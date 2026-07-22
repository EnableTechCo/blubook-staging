# Future production hotfix guide

Production does not exist yet, so do not use this guide today.

1. Confirm the problem and authorise the hotfix scope.
2. Create `hotfix/<ticket>` from production `main`.
3. Make the smallest safe fix and include tests.
4. Obtain an expedited review without bypassing the important protections.
5. Deploy, smoke-test, tag, and document the result.
6. Bring the same fix back to staging and test it before the next normal release.
