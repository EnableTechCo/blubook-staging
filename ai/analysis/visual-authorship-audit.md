# Frontend visual-authorship audit

## Scope and method

The public landing page and authentication routes were inspected in the rendered application at
desktop and compact breakpoints. Protected routes were audited through their shared components,
page compositions, tests, and data contracts because local preview credentials are intentionally
not available. The pass preserves component order, routes, behavior, semantics, and brand colors.

## Inventory and resolution

| Area | Classification | Resolution |
| --- | --- | --- |
| Arrangement, Sales, Reports, Transact, pending-offer, and onboarding-card ordinals | Remove | Removed decorative list position numbers; none represented sequence, rank, or business data |
| Four-step “How it works” numbering | Preserve | The order describes a real sequential operating process |
| Dashboard metrics, dates, statuses, references, and checklist positions | Preserve | Values carry real operational meaning or come from application data |
| “Work, seen as connected stories”, “In motion”, “Service packages”, contact kicker | Remove | The nearby headings and content already explain each section |
| Auth “Account portal” and footer “Secure access” | Remove | Container labels repeated the purpose already established by the page and form |
| Sales and Reports eyebrow/title pairs | Consolidate | Duplicate visible labels reduced to one descriptive page heading |
| Auth form card inside the full auth surface | Simplify | Removed the redundant inner border, translucent fill, radius, and shadow |
| Story section outer card and inner story-list card | Simplify | Replaced nested containers with spacing and quiet separators |
| Capability band, arrangement grid, comparison list, and contact block | Simplify | Replaced extra floating cards with borders and typographic grouping |
| Process cards inside the dark process surface | Simplify | Retained the sequence but removed four nested card treatments |
| Unattributed marketing quotation | Replace with verified content | Preserved the supplied product statement but rendered it as a heading, not testimony |
| Vanta hero atmosphere | Preserve | Intentionally requested, isolated to one desktop hero, disabled on compact/reduced-motion devices |
| Dark process, relationship, and footer surfaces | Preserve | Each marks a distinct semantic chapter rather than adding arbitrary dark mode |
| Role navigation, comparison toggle, status pills, form controls | Preserve | Pills and compact controls communicate selection, state, or action |

## Placeholder and owner-review items

- The consultation phone number remains explicitly labelled as an example. No verified production
  number exists in the repository, so replacing it would invent business data. Product ownership
  should supply the real consultation line before production launch.
- No fake logos, customer counts, ratings, testimonials, avatars, activity feeds, or social-proof
  claims were found.

## Functional boundary

No server action, query, API route, authentication rule, authorization rule, validation contract,
database type, migration, filter, status calculation, or navigation destination is changed by this
audit.
