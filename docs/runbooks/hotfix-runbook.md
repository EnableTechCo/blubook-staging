# Hotfix runbook

1. Confirm and authorise the incident scope.
2. Create `hotfix/<ticket>` from production `main`.
3. Implement the smallest safe fix with tests and a corrective migration only when required.
4. Obtain expedited review without bypassing critical protections.
5. Deploy, smoke test, tag, and document the hotfix.
6. Return the same fix to staging immediately and verify it before the next release.
