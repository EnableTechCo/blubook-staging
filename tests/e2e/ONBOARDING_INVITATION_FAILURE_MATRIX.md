# Invitation-led onboarding E2E failure matrix

This matrix is written before implementation. It defines the cases the first onboarding slice must survive. Full authenticated scenarios run only against a dedicated E2E Supabase project; ordinary CI must never create users in production or staging.

## Invite access and tokens

| Scenario | Expected result |
| --- | --- |
| Open signup without an invitation | Registration is refused; no profile, client, package, or upload is created. |
| Use a malformed, unknown, tampered, expired, revoked, or already-consumed invite | Show one generic unavailable-link message; reveal no email or customer existence. |
| Open the same valid invite in two tabs and submit both | At most one account is created; the losing submission receives a safe retry message. |
| Resend an invite | The new link works and every earlier link stops working immediately. |
| Attempt to create or resend an invite as a customer, provider, suspended user, or non-sales staff role | Server rejects the action even when called directly, outside the UI. |
| Send an invite for an email that already has an account | Return a non-enumerating response and do not create or modify an account. |
| Cause email delivery to fail or time out | No usable account is left without a credential setup path; invite remains safely retryable. |
| Inspect logs, analytics, and stored invite data | Raw tokens, setup links, passwords, and private form values are absent. |

## Customer submission and credential setup

| Scenario | Expected result |
| --- | --- |
| Submit a valid invite and complete form | Exactly one active partial client, package, onboarding checklist, and expected non-finance setup data exist. |
| Submit twice or retry after a network timeout | The operation is idempotent; no duplicate auth user, client, package, or checklist exists. |
| Fail validation or upload validation | No account or partial client is created. |
| Fail after auth-user creation during provisioning | Created auth user, client data, and uploaded objects are rolled back; invite can be retried. |
| Follow the one-time credential setup link | Password can be set once, the link is consumed, and normal login reaches the normal client dashboard. |
| Reuse or expire the credential setup link | It cannot establish a session or change the password again. |
| Change the primary account email | New address must be verified before it becomes the login address. |

## Partial access and Sales review

| Scenario | Expected result |
| --- | --- |
| New customer opens the dashboard before Sales approval | Normal non-finance dashboard and features work; Finance and accounting information stays unavailable. |
| New customer directly requests Finance routes or invokes finance queries/actions | Server-side and database authorization deny access, even if the UI is bypassed. |
| Sales review notification is created | Every active Sales rep and Sales admin receives an ordinary, non-urgent notification with only the minimum profile reference needed. |
| Customer or an unrelated role attempts to approve, change review status, or assign a Finance provider | The server and database reject it. |
| Sales user reviews, edits, requests changes, or approves | Permitted transitions succeed and append an attributable audit event. Self-approval is permitted. |
| Two editors save from the same profile version | The later stale save is refused rather than silently overwriting the first. |
| Customer edits their own core profile | Allowed editable fields save; lifecycle, ownership, package approval, and staff-only values cannot be changed. |
| Approved customer changes legal name, entity, registration, VAT, or package | Sales review reopens; any Finance case is held and finance submissions stop. |
| Approved customer changes contact or address only | Review remains approved. |
| Existing non-finance account submits work to a partner | Current routing and visibility behaviour is unchanged. |

## Repeatability and evidence

- The authenticated suite uses a dedicated E2E Supabase project and disposable accounts with unique run identifiers.
- The suite must clean up its own users, invites, clients, packages, uploads, and notifications after each run, including failed runs.
- Playwright HTML report, traces, screenshots, and video on failure are retained as a downloadable CI artifact.
- CI smoke scenarios run without privileged Supabase credentials; destructive/authenticated E2E scenarios require the dedicated E2E environment and must never point at production.
