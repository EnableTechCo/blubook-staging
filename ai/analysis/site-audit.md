# Protected frontend audit

Baseline: `origin/main` at `a757c1f`.

## Architecture

- Next.js App Router with one authenticated `/dashboard` layout.
- `AppShell` owns the responsive navigation rail, account toolbar, notifications, sign-out, and
  main content frame.
- Navigation and route protection are derived from the same role/capability services.
- Server Components compose route data; Server Actions own mutations.
- Shared visual primitives live in `src/components/ui` and `src/features/dashboard/ui.tsx`.
- Feature-specific workspaces preserve their current data, form, table, filter, modal, and action
  contracts.

## Protected route families

- Shared: dashboard, messages
- Client: sales, transact, reports, documents, notifications
- Provider: assigned work dashboard, client financials, reports, documents, notifications
- Staff: customers, onboardings, onboarding, service catalogue, default documents, work groups,
  partner tiers, compliance settings, staff roles, reports

## No-touch contracts

This redesign does not alter Supabase, migrations, generated database types, authentication,
authorization, RLS, API routes, server actions, service queries, validation, form field order,
table columns, filter semantics, or navigation destinations.
