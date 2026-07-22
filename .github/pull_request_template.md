## What changed?

Describe the change in plain language. Link the approved requirement or ticket when there is one.

## What should the reviewer and QA test?

List the expected result and any important edge cases.

## Database, security, or deployment impact

- [ ] This change has no database, access-control, secret, or deployment impact.
- [ ] This change includes a reviewed migration and generated database types.
- [ ] This change needs a forward-fix plan because it changes or removes existing data.

## Checks completed

- [ ] `pnpm check`
- [ ] `pnpm build`
- [ ] Relevant integration or end-to-end tests
- [ ] QA evidence or preview feedback is attached when needed
