# BluBook frontend decision log

## Baseline and sources

- Baseline is `origin/main` at
  `d3519cbecc7baf6306b7e177bc6634fe4d1211ea`.
- Current staging behaviour, Supabase contracts, RLS, and server-side role
  resolution remain authoritative.
- Figma MCP access is temporarily rate-limited. Do not retry it repeatedly.
- The local Human-Led and dashboard-direction sources are temporary visual
  references. Their hardcoded data, demo credentials, unsupported links, and
  role-selected destinations are not production behaviour.

## Decisions

- Keep one Supabase authentication backend and one shared validated login form.
  Client, Provider, and Staff pages are presentational variants only.
- Keep `/dashboard` as the authoritative post-login destination. Its server-side
  profile role determines which workspace renders.
- Do not pass a selected login role to the authentication action as proof of
  authorization.
- Convert the local palette to shared tokens: deep navy ink, warm paper, muted
  cobalt, focused yellow, clay for intervention, teal for confirmed completion.
- Use editorial serif headings, compact sans-serif body text, and restrained
  mono labels. Font loading must not make the application dependent on a remote
  runtime request.
- Prefer strong rules, ledger rows, square controls, minimal radii, and
  restrained shadows over generic floating dashboard cards.
- Preserve counterparty anonymity enforced by RLS. Mock Client and Provider
  names must not be copied into cross-role production views.
- Remove Client-facing package pricing and internal line-item configuration.
  Staff-only package pricing remains part of the existing onboarding contract.
- Do not show unsupported remember-me, password reset, social login, SSO, MFA,
  self-service package purchasing, trust scores, capacity scores, disputes,
  dependencies, messages, or stored documents.
- Use the clearly marked example number `+27 10 555 0142` until approved staging
  contact information exists. Do not copy the mock number ending in `0148`.
- Preserve the current Staff immediate-go-live onboarding behaviour. Do not
  imitate unsupported lead, agreement, draft activation, or coverage stages.
- Existing public signup creates a profile without a linked Client business or
  package. Do not promote it from the new landing or login variants pending a
  separate product/auth decision.

## Existing limitations to surface

- Suspended profile status is not enforced by the current middleware, role
  helper, or RLS functions.
- Supabase/internal errors are surfaced too directly in current auth and
  onboarding actions.
- Dashboard query errors currently collapse to empty data.
- Provider request updates do not expose a durable pending/result state.
- There is no password-reset contract.
- There are no backend contracts for disputes, messages, stored document files,
  linked-request dependencies, service-product logistics states, weighted
  routing scores, trust, availability, or network performance.

## Verification expectations

- Validate changed routes at 1440, 1024, 768, and 390 CSS pixels.
- Preserve visible status and operational context at narrow widths.
- Ensure keyboard focus, labels, error announcements, mobile-safe forms,
  password-manager semantics, and touch targets.
- Re-run lint, typecheck, unit/component tests, relevant Playwright tests, and
  the production build for every feature.
- Verify every feature diff contains no schema, ORM, migration, seed, generated
  database type, credential, or unrelated lockfile change.

## Landing image provenance

- The landing photography was supplied by the user as part of the local
  MagicPath/Figma handoff under
  `Mock/figma/human-led-image-edition/assets`.
- `hero-team.jpg`, `operations-desk.jpg`, and `advisor-consultation.jpg` are
  optimized derivatives of those supplied PNG files. No external image was
  downloaded and no third-party attribution claim was added.
- The handoff does not include an explicit production-use license. These images
  are approved only for staging review in this feature; production usage rights
  must be confirmed before release or promotion beyond staging.
