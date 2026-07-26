# BluBook frontend alignment audit

Baseline: `origin/main` at `d3519cbecc7baf6306b7e177bc6634fe4d1211ea` (2026-07-24).

The repository was fetched with `git fetch --prune origin` before this audit.
The `blubook-staging` checkout was fast-forwarded to the baseline and the work
was isolated on `feat/blubook-figma-foundation` in that same staging folder.
Database definitions, generated types, migrations, RLS policies, and application
queries were inspected read-only. No migration, seed, schema change, or direct
database write was performed.

## Architecture snapshot

- Next.js 16.2.6 App Router with React 19.2.6 and TypeScript 6.
- Tailwind CSS 3.4 with a minimal global stylesheet and no established token
  layer or component library.
- Supabase SSR authentication with a Next.js proxy that refreshes sessions and
  protects `/dashboard`.
- Authoritative role resolution from `profiles.user_type`; `/dashboard` renders
  the Client, Provider, or Staff workspace from that server-side profile.
- Server Components for route composition and data reads, Server Actions for
  authentication, onboarding, assignment, and request-status writes.
- Vitest, Testing Library, and Playwright are configured.
- Baseline results: lint passed; typecheck passed; 3 unit-test files and 9 tests
  passed; production build passed.

## Temporary visual source

The connected Figma account returned a Starter-plan rate-limit error before any
frame metadata could be read. Per the project direction, implementation must not
poll the Figma API while this limit remains active. The temporary visual sources
are:

- `Mock/figma/human-led-image-edition`
- `Mock/figma/blubook-dashboard-direction/index.html`
- `Mock/figma/blubook-dashboard-direction/styles.css`
- `Mock/figma/blubook-dashboard-direction/app.js`
- PNG exports in `Mock/figma/blubook-dashboard-direction/exports`

The local JavaScript contains demo credentials, hardcoded operational records,
role-selected destinations, and unsupported features. Those behaviours and data
must not be copied into staging.

## Gap-analysis matrix

| Area | Existing route/component | Current behaviour | Temporary visual reference | Status | Required frontend change | Backend limitation | Proposed branch/PR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Shared visual foundation | `layout.tsx`, `globals.css`, dashboard `ui.tsx` | Minimal slate Tailwind styling; no shared tokens, fonts, shell, focus, or responsive navigation | Local Human-Led landing reference and dashboard-direction CSS | Partially implemented | Add BluBook tokens, local font fallbacks, layout primitives, buttons, square status labels, accessible focus, responsive shell foundations | None | `feat/blubook-figma-foundation` |
| Public landing page | `/`, `page.tsx` | Foundation copy with Sign in and public Create account links | Human-Led reference | Partially implemented | Implement approved editorial landing composition, supported service categories, managed acquisition flow, role-login links, and example `+27 10 555 0142`; no pricing | No public contact/form API; use tel link and honest consultation guidance | `feat/public-landing-page` |
| Shared authentication | `/login`, `LoginForm`, `signIn` | Working Supabase password sign-in and loading state; raw backend errors; public signup link | `Login-Role-Selector.png` and local login source | Functionally complete, visual alignment needed | Shared auth layout/form, safe errors, password visibility, accessibility, responsive design, return-to-site and support paths | No password-reset contract; account-disabled status is not enforced | `feat/shared-auth-foundation` |
| Client login page | Generic `/login` | No Client-specific context; always redirects to authoritative `/dashboard` | Local Client role variant | Missing frontend only | Add presentational `/login/client` variant using shared action and authoritative redirect | Selected role must not become authorization input | Same cohesive auth PR |
| Provider login page | Generic `/login` | No Provider-specific context | Local Provider role variant | Missing frontend only | Add presentational `/login/provider` variant using shared action | Same as Client variant | Same cohesive auth PR |
| Staff/Admin login page | Generic `/login` | No Staff-specific context | Local Staff role variant | Missing frontend only | Add restrained `/login/staff` variant using shared action | No MFA/SSO/reset contract; do not invent them | Same cohesive auth PR |
| Role-aware post-login routing | `signIn`, `/dashboard`, `getCurrentProfile`, proxy | Successful sign-in redirects to `/dashboard`; server profile selects the authorized workspace | Local role selector is visual only | Functionally complete, visual alignment needed | Preserve authoritative routing; add variant-route proxy recognition and neutral wrong-role/session messaging | `profiles.status = suspended` is not currently enforced by middleware, helpers, or RLS | Same cohesive auth PR; document security limitation |
| Public signup | `/signup`, `SignUpForm` | Creates a Client profile but no linked Client business, package, or onboarding; can lead to a hollow dashboard | Local login says onboarding is Staff-led | Partially implemented / product-policy mismatch | Remove prominent public entry points pending a product decision; do not silently remove the route in a visual PR | Current signup contract does not create a usable Client workspace | Auth/public PR decision |
| Client workspace | `/dashboard`, `ClientDashboard`, `getClientDashboard` | Shows account, packages, requests, and compliance | Client dashboard export | Partially implemented | Compact ledger composition, supported request signals, responsive and accessible presentation | No request-health or priority aggregate; query errors collapse to empty | `feat/client-workspace-alignment` |
| Client package visibility | `ClientDashboard` and Client dashboard query | Exposes total package price, internal line items, unit prices, tiers, and quantities | Brief requires concise outcomes only | Partially implemented / policy mismatch | Remove pricing and internal configuration from Client query and UI; show safe package identity/status only | No stored public outcome descriptor on a Client package | Client workspace PR |
| Client requests | `RequestsTable` embedded on dashboard | Summary only; no filters, detail, origin/cadence, or event history | Client requests/detail exports | Partially implemented | Supported filters for status/service/time/origin; detail surface using request events; mobile-safe table/drawer | No recurrence/cadence field and no dependency model | Client workspace PR |
| Provider workspace | `/dashboard`, `ProviderDashboard`, assignment/status actions | Offers, capabilities, assigned work, accept/reject, complete/cancel | Provider dashboard/work-queue exports | Functionally complete, visual alignment needed | Preserve RLS/anonymity; add work-queue hierarchy, pending/error feedback, and responsive detail | No capacity, availability, trust, quality, rating, or performance contract | `feat/provider-workspace-alignment` |
| Provider product states | Request actions only | Generic request statuses; no product-level transition UI | Provider detail export | Blocked by current backend contract | Implement only confirmed generic request transitions and authoritative refresh/error feedback | No service-product model, logistics statuses, proof, or dependency roll-up | Provider PR supported subset; defer remainder |
| Staff command centre | `StaffDashboard`, `getStaffDashboard` | Real counts, recent requests, Client/Provider lists, and service catalogue | Staff Command Centre export | Partially implemented | Align to deep-navy/paper shell and supported operational ledger | No weighted score, network health, trust, capacity, at-risk classification, or disputes | `feat/staff-command-centre` |
| Staff onboarding | `/dashboard/onboard`, `/dashboard/onboardings`, onboarding actions | Immediate go-live workflow plus compliance checklist/status updates | Staff Client Onboarding export | Functionally complete, visual alignment needed | Preserve current workflow; improve layout, errors, responsive behaviour, and checklist presentation | No lead/needs/agreement/draft activation stages or coverage confirmation; no stored document files | `feat/staff-onboarding` |
| Staff package management | Package/catalogue tables and Staff CRUD RLS; no dedicated UI | Packages and line items are read only during onboarding | Staff Package Studio export | Missing frontend only for supported subset | List/edit supported package fields and existing catalogue items | No draft/published enum, cadence, requiredness classification, or coverage score | `feat/staff-package-management` |
| Staff service operations | Requests/events/assignments/schedules exist; no dedicated route | Recent request table only | Dashboard direction source | Missing frontend only for supported subset | Staff request ledger, supported filters, detail/history | No dependency engine or weighted routing data | Conditional `feat/staff-service-operations` |
| Disputes | No schema, type, route, API, or action | Unavailable | Staff Dispute Log export | Blocked by current backend contract | Do not build a fake dispute page | All dispute/evidence/SLA/history contracts absent | Deferred; no branch |
| Messages and documents | Compliance checklist metadata only | No messages or stored file archive | Inert mock navigation | Blocked by current backend contract | Omit completed-looking destinations; use honest unavailable states only when needed | No messages or document-storage contract | Deferred |
| Dependencies and linked requests | No schema or engine | Unavailable | Mock dependency visuals | Blocked by current backend contract | Do not invent links, locks, or roll-ups | No dependency model | Deferred |
| Analytics and settings | Basic dashboard counts and profile row | No dedicated routes | Inert mock navigation | Partially implemented / deferred | Only expose supported aggregates in future scope | No performance history; incomplete settings semantics | Deferred |

## File ownership

| Owner | Files and areas |
| --- | --- |
| Agent 1 — technical lead | Global tokens and typography; `src/app/layout.tsx`; `globals.css`; public landing; `src/app/login/**`; `src/features/auth/**`; proxy/session integration; shared shell and primitives; route-level integration; shared services and collision-sensitive files; architecture review |
| Agent 2 — Client/Provider | `ClientDashboard.tsx`; `ProviderDashboard.tsx`; new Client/Provider-local request components and role-specific tests. Shared request/service files change only through Agent 1. |
| Agent 3 — Staff/Admin | `StaffDashboard.tsx`; Staff onboarding routes and components; future `src/features/staff/**`; Staff-specific tests. Shared dashboard/service files change only through Agent 1. |
| Read-only / no-touch | `supabase/**`, generated `src/types/database.ts`, migrations, seeds, database schema, and database records |

`src/services/dashboard.ts`, `src/features/dashboard/ui.tsx`,
`src/features/dashboard/RequestsTable.tsx`, `src/app/dashboard/page.tsx`, and
auth/session code are integration-sensitive and have one active owner at a time.

## Cohesive branch and PR sequence

1. `feat/blubook-figma-foundation`
2. `feat/public-landing-page`
3. `feat/shared-auth-foundation` — one shared form and three presentational variants
4. `feat/client-workspace-alignment`
5. `feat/provider-workspace-alignment`
6. `feat/staff-command-centre`
7. `feat/staff-onboarding`
8. `feat/staff-package-management`
9. Conditional supported Staff service-operations feature

Disputes, messages, stored documents, dependency roll-ups, logistics product
states, and trust/performance analytics are deferred until authoritative backend
contracts exist. Each feature stops at its manual-review gate; nothing is merged
or deployed without approval.
