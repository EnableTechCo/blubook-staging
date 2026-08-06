# BluBook Sales Pipeline and Bookings — Pull Request Plan

**Status:** PR 1 implemented and prepared for review; PRs 2–4 remain queued

**Prepared:** 2026-08-06

**Implementation plan:** `docs/SALES_PIPELINE_AND_BOOKINGS_IMPLEMENTATION_PLAN.md`
**User lifecycle:** `docs/SALES_PIPELINE_USER_LIFECYCLE.md`

## 1. Delivery strategy

Deliver the feature as four sequential, normally reviewed pull requests.

```text
PR 1: Opportunity data and security foundation
  ↓
PR 2: Client Pipeline UI and CRUD
  ↓
PR 3: PO linking, provider invoice return and automatic booking
  ↓
PR 4: Client Bookings, payment lifecycle and end-to-end hardening
  ↓
Future tranche: Performance dashboards and data visualisations
```

Each PR must:

- branch from the latest merged `main` after the previous PR lands;
- contain only its stated scope;
- be independently deployable and CI-green;
- include relevant migrations, generated database types, tests, screenshots, and migration notes;
- avoid editing already-applied Supabase migrations; and
- avoid introducing placeholder dashboard or phasing calculations.

Do not keep all four changes on one stacked, long-lived branch. Where possible, merge PR 1 before branching PR 2, and repeat that pattern through PR 4.

## 2. PR 1 — Opportunity data, permissions and lifecycle foundation

### Suggested title

```text
Add sales opportunity data model and access controls
```

### Purpose

Create the secure source of truth shared by Pipeline and Bookings. This PR intentionally exposes no unfinished Sales navigation.

### Schema scope

Add `sales_opportunities` with at least:

- immutable UUID primary key;
- client ownership;
- generated `BLB-YYYY-NNNNNN` Deal ID;
- opportunity source;
- opportunity name;
- controlled forecast category;
- ZAR revenue using a decimal database type;
- fiscal year;
- fiscal quarter 1–4;
- quarter-relative fiscal week 1–13;
- invoice number;
- Paid/Unpaid state;
- `booked_at` and `paid_at` timestamps;
- creation/update actors and timestamps; and
- deletion/archive fields if needed for pre-booking lifecycle management.

Add an append-only opportunity event/history table for:

- creation;
- business-field edits;
- category transitions;
- booking;
- invoice-number changes;
- payment transitions; and
- deletion/archive attempts and outcomes where appropriate.

### Product rules

- An opportunity can exist without a PO.
- Deal ID is generated and cannot be edited.
- The client owns the opportunity and can access only its own client records.
- External providers and internal sales staff cannot browse/query opportunity tables.
- Only narrowly authorized database/server operations added in later PRs may allow a provider to change invoice/payment information.
- Revenue must be non-negative.
- Fiscal quarter and week must remain in their allowed ranges.
- Store category definitions as controlled product data rather than duplicating descriptive text in UI components.

### Engineering scope

- Add immutable Supabase migration(s), constraints, indexes, RLS, and grants.
- Add Zod/domain validation and typed service boundaries.
- Regenerate `src/types/database.ts` from the migrated database.
- Add database comments documenting lifecycle invariants.
- Add server-side mutation field whitelists.

### Tests

- Own-client CRUD succeeds.
- Cross-client reads and writes fail through direct API calls.
- External provider and internal sales staff table access fails.
- Deal IDs are unique and immutable.
- Revenue and fiscal ranges are validated.
- Event history is written for material changes.
- Migration reset, generated-type consistency, lint, typecheck, unit tests, and build pass.

### Acceptance criteria

- There is exactly one canonical opportunity row for all future Pipeline/Bookings fields.
- No UI-only permission is relied upon.
- The schema supports an opportunity with zero or one PO without requiring the PO relationship yet.

### Product gates before merge

- Definition of `Open` and relationship/order between Upside and Best Case.
- Initial payment state. Current recommendation: `Unpaid` when a PO completes.
- Invoice-number uniqueness. Current recommendation: case-insensitive per client.
- Whether recorded revenue is VAT-inclusive or VAT-exclusive.

## 3. PR 2 — Client Sales navigation and Pipeline CRUD

### Suggested title

```text
Add client sales pipeline workspace
```

### Purpose

Deliver the client’s independent pre-PO opportunity workflow.

### UI scope

- Add top-level **Sales** navigation for client users only.
- Add **Pipeline** and **Bookings** child navigation, but keep Bookings unavailable or as a clear non-interactive future destination until PR 4.
- Add `/dashboard/sales/pipeline`.
- Add **Add Opportunity**.
- Display Opportunity Source, Deal ID, Opportunity Name, Forecast Category, Revenue, Fiscal Year, Fiscal Quarter, and Fiscal Week.
- Add row actions for edit, delete, and **Submit PO**.
- In this PR, **Submit PO** may route only after the PR 3 destination is available; do not ship a dead action. Either omit it until PR 3 or guard it behind the PR 3 delivery boundary.

### Editing and deletion

- The client can create and save an opportunity without submitting a PO.
- All business fields are client-editable; Deal ID is read-only.
- A pre-PO opportunity can be deleted.
- The server action must enforce ownership and field validation independently of the UI.
- Use accessible confirmation for deletion and preserve actionable server errors.

### Tests

- Client sees Sales/Pipeline navigation.
- External provider and staff do not see Sales navigation.
- Create, edit, refresh, and delete persist correctly.
- Deal ID cannot be changed through a crafted mutation.
- Cross-client mutation fails.
- Empty, error, validation, and responsive-table states render correctly.
- Playwright: create opportunity → edit values → refresh → delete.

### Acceptance criteria

- A client can manage an opportunity indefinitely without a PO.
- No Bookings record is created merely by selecting the category `Booked`.
- No dashboard or performance calculation is introduced.

### Dependency

PR 1 merged into `main`.

## 4. PR 3 — PO linking, provider invoice return and automatic booking

### Suggested title

```text
Link purchase orders to opportunities and deliver invoices
```

### Purpose

Make both PO entry paths produce one correctly linked opportunity/PO lifecycle, then allow the assigned external provider to return an invoice and complete the PO.

### Database scope

- Add nullable `sales_opportunity_id` to `service_requests`.
- Enforce that a `purchase_order` request has exactly one opportunity at submission.
- Enforce no more than one PO per opportunity.
- Validate same-client relationships.
- Add a source/parent-request relationship for invoice `document_delivery` requests.
- Add narrowly authorized transactional functions for:
  - provider invoice return and PO completion; and
  - automatic booking triggered by canonical PO completion.
- Ensure all operations are idempotent and audited.

### Entry path A — Pipeline

- Add **Submit PO** to every eligible Pipeline row.
- Open the existing PO page with the internal opportunity ID carried securely.
- Display the Deal ID, opportunity name, revenue, and expected-payment period as a locked confirmation.
- Submit the PO with the selected opportunity relationship.
- After submission, replace the row action with **View PO** and the relevant status.

### Entry path B — Direct Transact channel

Add a required **Pipeline Opportunity** step before the existing PO details:

1. **Select existing:** list only current-client opportunities without a PO.
2. **Create new:** collect all Pipeline business fields.

On final submission:

- selecting existing creates only the linked PO request;
- creating new creates the opportunity and PO together and links them;
- failure creates neither record in the create-new path; and
- abandoning an intermediate step creates no opportunity or PO.

### Provider invoice completion

For an assigned linked PO, replace/guard generic completion with **Send invoice and complete**.

Require:

- invoice number; and
- invoice document upload.

The atomic operation must:

1. validate the provider owns the accepted assignment;
2. store the invoice number;
3. persist the invoice document;
4. create one related client-facing `document_delivery` request;
5. complete the original PO request;
6. set forecast category to `Booked`;
7. set permanent `booked_at`; and
8. record the source PO and delivery request in audit history.

The client can download and acknowledge the invoice through the existing request-delivery experience. Acknowledgement confirms receipt only and does not mark Paid.

### Tests

- Pipeline entry preselects and locks the correct opportunity.
- Direct entry can select an eligible existing opportunity.
- Direct entry can create and link a new opportunity atomically.
- Abandoned/failed direct entry leaves no partial record.
- Cross-client, duplicate-PO, non-PO, and tampered links fail.
- Provider cannot complete a linked PO without invoice number/document.
- Unauthorized provider cannot complete or invoice another provider’s request.
- Repeated completion does not create duplicate booking events or invoice deliveries.
- Client downloads and acknowledges the invoice.
- Acknowledgement does not alter payment status.
- Existing tender/general/document-delivery flows remain unaffected.
- Playwright: Pipeline → Submit PO → provider invoice completion → client invoice acknowledgement.

### Acceptance criteria

- Every newly submitted PO is linked to exactly one opportunity.
- One opportunity cannot receive a second PO.
- A completed linked PO permanently qualifies the deal for Bookings.
- External providers never receive Pipeline or Bookings table access.
- No logistics handover workflow is introduced.

### Dependency

PRs 1 and 2 merged into `main`.

## 5. PR 4 — Client Bookings and payment lifecycle

### Suggested title

```text
Add client bookings tracking and payment lifecycle
```

### Purpose

Expose completed-PO opportunities through a client-only Bookings view and complete the Booked → Paid → Closed lifecycle.

### Bookings UI

Add `/dashboard/sales/bookings` with:

| Field | Client access |
| --- | --- |
| Deal ID | View |
| Opportunity Name | View |
| Invoice Number | View only |
| Revenue | Edit |
| Paid/Unpaid | Edit |
| Fiscal Year | Edit |
| Fiscal Quarter | Edit |
| Fiscal Week | Edit |

Membership is based on permanent completed linked PO / `booked_at`, not the current forecast-category label.

### Payment lifecycle

- Default a newly booked deal to the approved initial payment status.
- Client can change Paid/Unpaid in Bookings.
- Assigned external provider can use a narrow Paid/Unpaid action on its linked completed PO detail without Sales/table access.
- Marking Paid sets `paid_at` and automatically changes forecast category to `Closed`.
- Both payment and category transitions are audited.
- Reverting to Unpaid records the reversal but does not silently change Closed back to an earlier category.

### Synchronization

- Pipeline and Bookings query the same opportunity row.
- Revenue and fiscal-period changes from Bookings must immediately appear in Pipeline after mutation/revalidation.
- Pipeline edits must immediately appear in Bookings.
- Do not add duplicated booking revenue/week/quarter columns or a synchronization job.
- Add an updated-at/version guard or equivalent protection against silent concurrent overwrites.

### Deletion

- A deal with a completed linked PO can never be deleted.
- Changing its category away from Booked does not remove this protection.
- A paid/closed deal also cannot be deleted.
- Enforce the rule in the database/server boundary, not only by hiding the UI action.

### Tests

- Only completed-linked-PO opportunities appear.
- Manually choosing Booked without PO completion does not qualify.
- A completed-PO deal remains visible after category edits.
- Client can edit only the approved Bookings fields.
- Provider cannot query either table or mutate revenue/fiscal values.
- Provider’s narrow payment action works only for its own completed linked PO.
- Pipeline and Bookings shared fields remain consistent in both directions.
- Paid sets `paid_at` and category Closed in one audited operation.
- Reverting to Unpaid does not silently reopen the category.
- Completed-PO deals cannot be deleted through UI or direct API calls.
- Playwright: create opportunity → submit PO → provider sends invoice/completes → client acknowledges → client edits booking → mark Paid → verify Closed.

### Acceptance criteria

- The complete opportunity-to-paid lifecycle is usable and covered end to end.
- Pipeline and Bookings cannot drift.
- Role boundaries are proven with direct authorization tests.
- The tranche is ready to become the data source for future dashboards.

### Dependency

PRs 1–3 merged into `main`.

## 6. Cross-PR review checklist

Every PR description should include:

- objective and explicit exclusions;
- screenshots for changed UI states;
- migration names and local reset result;
- regenerated-type confirmation when schema changes;
- authorization/RLS test summary;
- unit/integration/E2E commands run;
- accessibility considerations;
- known follow-up work; and
- confirmation that performance visualisations remain out of scope.

Required CI/checks, using the repository’s current scripts:

- lint;
- typecheck;
- unit tests;
- production build;
- relevant Playwright coverage; and
- migration filename/workflow validation.

## 7. Deferred performance-data visualisation tranche

Performance dashboards and data visualisations begin only after PR 4 is complete and merged.

Deferred items include:

- cumulative Target versus Actual phasing;
- quarterly targets and QTD phasing;
- slipped, Commit, Best Case, and Upside summaries;
- phasing by product category;
- total transactional phasing;
- sales, operations, and finance dashboard cards;
- cashflow, EBITDA, working capital, debt-to-equity, current ratio, churn, and service-request performance; and
- any Trip Report workflow or visualisation.

Before planning that tranche, perform a new requirements pass covering metric definitions, data sources, target entry, aggregation rules, reporting periods, permissions, and dashboard layout. PRs 1–4 should supply trustworthy lifecycle data but should not guess or hardcode any performance metric.
