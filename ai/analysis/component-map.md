# Frontend component map

## Shared shell

- `AppShell`: protected app frame and account actions
- `ShellNavigation` / `NavIcon`: role-aware desktop and mobile navigation
- `BrandMark`: existing BluBook assets

## Shared primitives

- `Button` / `buttonStyles`: primary, secondary, light, and quiet actions
- `formStyles`: input, file input, label, and help-text styles
- `StatusLabel`: semantic lifecycle badges
- `Editorial`: page header and general panel
- `RecordList`: responsive non-tabular record collections
- `dashboard/ui`: workspace header, section, stat, empty state, formatting helpers

## Data-dense surfaces

- `RequestsTable`: wide operational comparison table with sticky headers/identifier
- `RequestSummary` / `RequestPerformanceDashboard`: metric and performance views
- Client metric cards: sales, operations, finance, compliance
- Feature workspaces: sales pipeline/bookings/targets, financial intake, document archive,
  onboarding review, messages, customer and catalogue editors

The redesign is implemented through the shared shell and primitives first. Custom surfaces receive
targeted presentation updates while their component boundaries and behavior remain intact.
