# BluBook Sales Pipeline and Bookings Implementation Plan

**Status:** PR 1 implemented and prepared for review; PRs 2–4 remain planned

**Prepared:** 2026-08-06

**Repository:** `blubook-staging`
**Implementation baseline:** `origin/main` at `15e3c17`; PR 1 branch `feature/sales-opportunity-foundation`
**Product workbook reviewed:** `C:\Users\nhlan\Downloads\Blubook Sales Dash.xlsx`
**Dedicated PR plan:** `docs/SALES_PIPELINE_PR_PLAN.md`

This file is the durable implementation reference for the first client-requested sales feature tranche. Update the decision log before development when the client supplies the forecast-category spreadsheet or resolves one of the open questions below.

## 1. Outcome

Build a client-owned sales pipeline and bookings tracker that uses one deal record as the source of truth.

- Clients can create, view, edit, and remove/retire pipeline opportunities.
- Pipeline opportunities can exist independently for the entire pre-PO sales conversation; creating an opportunity never requires submitting a PO.
- A deal has an auto-generated Deal ID, opportunity source, opportunity name, forecast category, expected revenue, fiscal week, and fiscal quarter.
- A pipeline opportunity can be linked to an existing purchase-order service request.
- When that linked PO request reaches `completed`, its opportunity is automatically changed to `Booked`.
- The bookings screen is client-only, shows deals with a linked completed PO, and permits the limited booking edits specified by the client.
- Revenue and fiscal-period edits made in either screen immediately appear in the other because both screens update the same database row.

The client called the original concept a “Customer Intake Form,” but this is a sales pipeline hub, not customer intake. Use “Sales Pipeline” in routes and UI copy unless the client later chooses another label.

## 2. Architecture decision

### One record, two views

Do not create independent pipeline and bookings records with copied revenue or fiscal-period values. Create a single `sales_opportunities` record and expose it through two filtered/editing experiences:

1. **Pipeline:** all client opportunities and all pipeline-editable fields.
2. **Bookings:** opportunities in `Booked` or an agreed later lifecycle state, with a restricted booking field set.

This removes a fragile two-way synchronization problem. Updates to shared columns are transactional and visible in both views without reconciliation jobs, triggers that copy values, or duplicate-row drift.

### Database-owned PO completion automation

The transition to `Booked` should be enforced in PostgreSQL when a linked `purchase_order` service request changes to `completed`. It must not live only in a React component or one server action because service-request status can be changed through multiple workflows now or in the future.

The trigger must be idempotent and must validate that the request:

- is a `purchase_order` request;
- belongs to the same client as the opportunity; and
- is explicitly linked to that opportunity.

## 3. Confirmed product requirements

### 3.1 Pipeline

The pipeline is a client sales-tracking workspace under a top-level **Sales** navigation destination, with **Pipeline** and **Bookings** as its two children.

| Field | Behaviour |
| --- | --- |
| Opportunity Source | Editable; initial examples are `Team` and `Web` |
| Deal ID | System generated, unique, displayed but not manually edited |
| Opportunity Name | Editable |
| Forecast Category | Editable subject to lifecycle rules; exact categories/definitions await the client spreadsheet |
| Revenue | Editable; ZAR display in the current product context |
| Fiscal Week | Editable |
| Fiscal Quarter | Editable |

Clients must be able to add deals, edit all business fields in the pipeline table, and delete/retire deals subject to the financial-record policy in Decision D7.

An opportunity may remain in Pipeline without a PO for any length of time while the client is still speaking to the customer. The PO relationship is optional on the opportunity side. Only the inverse is required: every submitted PO must select or create exactly one pipeline opportunity.

### 3.1.1 Forecast categories confirmed from the workbook

| Category | Product meaning | Implementation note |
| --- | --- | --- |
| Open | Present in sample data; no written definition supplied | Await definition/entry rule |
| Upside | Deal with a realistic chance of closing in the current quarter | Client-editable category |
| Best Case | Moderately confident opportunity that could close if things go perfectly | Client-editable category |
| Commit | Highly confident deal (80–90%+ close rate), contracts in final stages, no major risks remain | Client-editable category |
| Booked | **Corrected product definition:** linked PO submission work has completed | This explicit client correction supersedes the workbook’s older “Shipped and Invoiced” wording |
| Closed | Money in the bank | Marking Paid automatically sets Closed; the transition is audited |

Do not infer a strict ordering between Upside and Best Case until the client confirms it. Store the definitions as controlled product data so wording/order can be corrected without rewriting historical deals.

### 3.2 Bookings tracking

The supplied bookings example contains these columns, in this order:

| Field | Editable in bookings | Notes |
| --- | --- | --- |
| Deal ID | No | Same generated ID as the pipeline record |
| Opportunity Name | No | Mirrors the same opportunity record |
| Invoice Number | External service provider only, outside this table | Displayed read-only to the client; provider enters it while completing the linked PO request |
| Revenue | Client only | Same field used by pipeline; never a copy |
| Paid/Unpaid | Client in Bookings; external provider through the request detail | Constrained status action; providers do not receive Sales navigation/table access |
| Fiscal Week | Client only | Same expected-payment period field used by pipeline |
| Fiscal Quarter | Client only | Same expected-payment period field used by pipeline |

The current interpretation is that the phrase “the only fields that I want editable are all of the ones on the pipeline table” means:

- the pipeline permits editing all its business fields except the generated Deal ID; and
- bookings permits the five fields explicitly named by the client: invoice number, revenue, paid/unpaid, fiscal week, and fiscal quarter;
- invoice number is external-service-provider-editable through the assigned PO workflow and client-readable in Bookings;
- only the client can edit revenue and expected-payment fiscal year/quarter/week; and
- the client can change Paid/Unpaid in Bookings, while the assigned external provider can use a narrow payment action on the completed PO/request detail without seeing either sales table.

### 3.3 Booked definition and PO link

`Booked` means the customer has submitted a PO and the assigned external service provider has completed the work required for that PO submission. The provider records the invoice number and returns the invoice document as part of completing the PO work. No invoice-generation system or logistics handover workflow is included in this tranche.

The existing product already has `purchase_order` service requests and a `completed` service-request status. A new explicit relationship is required so the system can identify which opportunity a completed PO belongs to.

Recommended UX:

- Every opportunity row has a stable internal UUID plus its displayed Deal ID.
- Each pipeline opportunity row has a **Submit PO** action in its Actions column. It opens the existing PO flow carrying that internal opportunity ID and shows a read-only summary of Deal ID, name, revenue, and expected-payment period.
- If the client starts through the regular Transact → Purchase Order channel, the PO flow begins with a **Pipeline transaction** page/step. The client must either:
  1. choose an existing opportunity belonging to that client that does not already have a PO; or
  2. enter the new opportunity’s source, name, forecast category, revenue, fiscal year, fiscal quarter, and fiscal week.
- New opportunity details entered through the regular PO channel populate the Pipeline automatically when the PO is finally submitted. The opportunity and PO request are created and linked in one database transaction; abandoning or failing the form must not leave a half-created opportunity or unlinked PO.
- When entering through a Pipeline row, the pipeline step is already satisfied and the client moves directly to the PO details page with the selected transaction locked in.
- Before submission, the client confirms the chosen opportunity. The server revalidates ownership and one-PO eligibility, then writes `sales_opportunity_id` on the new `service_requests` row in the same operation.
- The relationship targets the opportunity row, not individual revenue/category fields. Later field edits do not break the link because the opportunity UUID never changes.
- The link becomes immutable after submission. A wrongly linked PO is cancelled and resubmitted (or corrected through an audited administrative support path) rather than silently relinked after work starts.
- For linked POs, the provider’s generic **Complete** action is replaced by **Send invoice and complete**. It requires an invoice number and invoice document.
- That server/database operation stores the invoice number, attaches the document, creates a client-facing invoice `document_delivery` request related to the source PO, and completes the PO transactionally.
- PO completion changes the opportunity to `Booked`, records `booked_at`, and makes it appear in Bookings.
- The client opens the invoice delivery request, downloads the document, and acknowledges receipt. Acknowledgement confirms delivery only; it does not mean the invoice is paid.

An opportunity can have zero or one PO; a PO must have exactly one opportunity. A completed linked PO is a permanent lifecycle fact even if a user later changes the editable forecast-category label away from `Booked`. Bookings membership and delete protection therefore depend on the completed linked PO / `booked_at`, not on the current category text.

PO amount must not silently replace opportunity revenue unless the client explicitly requests that behaviour.

### 3.4 Workbook phasing reference

The supplied workbook also contains a populated **Total Bids Phasing** chart/table with cumulative Week 1–13 Target and Week 1–10 Actual values. It contains static values rather than formulas. The **Total Phasing**, **Total Transactional Phasing**, **Phasing By Product Category**, and **Trip Report** sheets are currently blank.

These sheets are evidence for a later dashboard/phasing tranche, not requirements to add calculations to PRs 1–4. When that tranche is specified, dashboard metrics must be derived from the application data model rather than copying the workbook’s sample values.

## 4. Current-system map

The following existing areas are integration points, not replacements:

| Area | Current location / behaviour | Planned integration |
| --- | --- | --- |
| Role navigation | `src/components/layout/AppShell.tsx` builds client/provider/staff navigation | Add the approved client sales destination and role tests |
| Reports | `src/app/dashboard/reports/page.tsx` is currently available to clients/providers | Leave unchanged; Sales is a new top-level navigation area |
| PO entry | `src/app/dashboard/transact/purchase-order/page.tsx` | Accept/preselect an opportunity and display the relationship |
| Submission | `src/features/transact/TransactionSubmissionForm.tsx` and `submissionActions.ts` create service requests | Persist the explicit opportunity link with authorization checks |
| Service requests | `service_requests` uses request type/status enums and existing RLS | Add the narrow opportunity relationship without creating a second PO flow |
| Completion | Existing provider actions update assigned request status; DB triggers already stamp completion and events | Add DB automation for linked PO completion, independent of the actor/UI |
| Document delivery | Existing `document_delivery` requests expose a download and remain open until the client acknowledges receipt | Reuse this mechanism for the provider-returned invoice, linked back to the source PO |
| Audit trail | `request_events` records request transitions | Add opportunity lifecycle/payment audit entries or an equivalent append-only mechanism |
| UI primitives | `src/features/dashboard/ui.tsx` supplies workspace, stat, money, and empty-state patterns | Reuse the established staging UI language |
| Validation | Server actions generally use Zod, ownership checks, revalidation, and redirects | Follow the same pattern for opportunity mutations |
| Generated DB types | `src/types/database.ts` | Regenerate after every schema migration; do not hand-edit |
| CI | Lint, typecheck, unit tests, build, Playwright, and migration filename validation | Each PR must remain independently green |

Important existing constraint: staff includes `sales`, `operations`, and `admin`, but the present PO-completion interaction is service-provider-oriented. The database automation must therefore react to the canonical request state rather than assume which UI or role completed it.

## 5. Proposed domain model

Final names can change during implementation, but the semantic model should remain stable.

### 5.1 `sales_opportunities`

| Column | Purpose / constraint |
| --- | --- |
| `id uuid` | Primary key |
| `client_id uuid` | Required owner; foreign key to client |
| `deal_reference text` | System-generated, immutable, globally unique; format `BLB-YYYY-NNNNNN` |
| `opportunity_source` | Controlled source value; initial values Team/Web unless made configurable |
| `opportunity_name text` | Required, trimmed business label |
| `forecast_category` | Controlled value populated from approved definitions |
| `revenue numeric(14,2)` | Non-negative expected/booked revenue |
| `currency text` | Default `ZAR`; include now to avoid ambiguous money data |
| `fiscal_week smallint` | Quarter-relative week 1–13, matching the workbook’s phasing model |
| `fiscal_quarter smallint` | Quarter 1–4 selected by the user |
| `fiscal_year smallint` | Reporting year associated with the expected-payment quarter/week |
| `invoice_number text null` | Booking field; uniqueness scope is a decision gate |
| `invoice_delivery_request_id uuid null` | Links the client-visible invoice delivery/acknowledgement request |
| `payment_status` | Constrained value, initially `unpaid`/`paid` when applicable |
| `booked_at timestamptz null` | Set on first valid booking transition |
| `paid_at timestamptz null` | Set/cleared consistently with payment state |
| `created_by uuid` | Audit actor |
| `created_at`, `updated_at` | Standard timestamps |
| `archived_at`, `archived_by` | Recommended safe removal for financial records |

### 5.2 Relationship to PO service requests

Prefer an explicit nullable `sales_opportunity_id` foreign key on `service_requests`, indexed for lookup. Enforce no more than one purchase-order request per opportunity. Add an explicit source/parent-request relationship for the invoice delivery request so support and the UI can navigate PO → invoice delivery → acknowledgement.

Database validation must prevent cross-client links and reject non-PO request types. If a direct foreign key cannot express all constraints, use a constraint trigger plus server-action validation.

### 5.3 Opportunity audit events

Record material lifecycle changes in an append-only history, including:

- creation and archive/removal;
- forecast-category changes;
- automatic booking and the triggering service-request ID;
- revenue and fiscal-period changes;
- invoice-number changes; and
- paid/unpaid transitions.

Store actor and source (`client_action`, `staff_action`, `po_completion_trigger`) so support can explain why values changed.

## 6. Permissions model

RLS is the authority; hiding controls in the UI is not sufficient.

| Actor | Pipeline | Bookings | PO automation |
| --- | --- | --- | --- |
| Client user | Read/create/update own client’s opportunities; delete only deals that have never had a completed linked PO | Read own bookings; edit revenue, expected-payment year/quarter/week, and Paid/Unpaid; invoice number is read-only | Link only own client’s eligible opportunity during PO submission; download and acknowledge returned invoice |
| External service provider | No Sales navigation and no Pipeline table access | No Bookings table access; narrow Paid/Unpaid action may appear on its completed linked PO detail | On its assigned PO request, enter invoice number, upload invoice, and use **Send invoice and complete** |
| Sales staff | No Pipeline or Bookings table access for this feature | None | None by default; this workflow is assigned to an external provider, not the internal sales staff role |
| Admin staff | Support/audit access according to existing staff policy | Support/audit access | State transition triggers regardless of UI actor |
| Operations staff | Least privilege; read only if operational need is confirmed | No default financial mutation | No special bypass |
| Service provider | No pipeline/bookings access by default | None | Existing authorized PO completion can cause the DB-owned transition |

Do not grant external providers table-level opportunity access merely to support their two actions. Expose narrowly authorized server/database functions for invoice delivery and payment status, validating that the provider owns the accepted PO assignment.

## 7. Progressive PR roadmap

Each PR is based on the latest merged `main`, not on a long-lived stacked branch. Merge in order because later PRs depend on the schema and behaviours established earlier. Every PR must be reviewable, deployable, and CI-green on its own.

### PR 1 — Sales opportunity foundation

**Goal:** Establish the secure, auditable source of truth without exposing unfinished UI.

**Scope**

- Add immutable, correctly timestamped Supabase migration(s) for `sales_opportunities`, controlled states/lookups, indexes, timestamps, and audit history.
- Add globally unique `BLB-YYYY-NNNNNN` deal-reference generation.
- Add RLS and grants for client ownership and approved staff read/mutation access.
- Add domain validation, the workbook-confirmed category definitions, and typed query/mutation boundary modules.
- Regenerate `src/types/database.ts` from the migrated schema.
- Document the lifecycle invariants in migration comments or architecture docs.

**Tests**

- Required/invalid field validation, money bounds, week/quarter/year rules.
- Deal-reference uniqueness and immutability.
- Cross-client RLS denial and own-client access.
- Audit-event creation for material updates.
- Local Supabase reset/migration validation plus lint, typecheck, unit tests, and build.

**Acceptance criteria**

- There is exactly one canonical revenue/fiscal-period value per opportunity.
- A client cannot read or mutate another client’s deal through direct API calls.
- Generated types match the migrated database.

**Dependencies:** the forecast-category spreadsheet and the remaining open decisions for a stable merge. If definitions are still expected to change, implement categories as data in a controlled lookup rather than a rigid enum.

### PR 2 — Client Sales Pipeline CRUD and navigation

**Goal:** Deliver the first usable client workflow.

**Scope**

- Add the top-level **Sales** navigation area with **Pipeline** and **Bookings** children, using `/dashboard/sales/pipeline` and `/dashboard/sales/bookings`.
- Add accessible create/edit UI for opportunity source, name, forecast category, revenue, fiscal period, and year/date.
- Display generated Deal ID read-only.
- Add table sorting/filtering only if it is cheap and does not delay core CRUD; pagination/server filtering should be considered before data volume grows.
- Add delete action only for deals that have never had a completed linked PO; booked/paid deals cannot be deleted.
- Use server actions with Zod validation, RLS-backed ownership, error states, revalidation, and no optimistic loss of server errors.
- Provide responsive table handling consistent with the existing app.

**Tests**

- Client navigation visibility; no provider visibility; approved staff visibility only.
- Empty, loading, error, create, edit, and remove/archive states.
- Attempted Deal ID edits and cross-client mutations are rejected.
- Form accessibility and business validation.
- At least one Playwright path: create → edit → verify → remove/archive.

**Acceptance criteria**

- A client can maintain the full pipeline without direct database access.
- Refreshing the page preserves every change.
- Only the generated Deal ID is immutable in the pipeline UI.

**Dependencies:** PR 1.

### PR 3 — PO linkage and automatic `Booked` transition

**Goal:** Connect the existing PO workflow to the sales lifecycle without building a second PO or logistics workflow.

**Scope**

- Add the explicit service-request/opportunity relationship and indexes/constraints.
- Add one **Submit PO** action to every eligible pipeline row.
- Add the **Pipeline transaction** step to the regular PO flow, supporting either selection of an eligible existing opportunity or inline entry of a new opportunity.
- Create the new opportunity and PO atomically on final submission; do not persist abandoned form steps or allow either record to exist without the other in this path.
- Require the existing PO form/action to carry one client-owned eligible opportunity, whether preselected from Pipeline, selected in the regular flow, or created through the regular flow.
- Show the linked Deal ID/name on relevant PO and service-request detail screens.
- Add the source/child relationship for invoice delivery requests.
- Replace generic completion for linked POs with an atomic **Send invoice and complete** operation requiring invoice number and invoice document.
- Reuse the existing `document_delivery` request/acknowledgement experience to let the client download and acknowledge the returned invoice.
- Add an idempotent DB trigger that responds to a linked `purchase_order` request moving to `completed`:
  - set forecast category to `Booked`;
  - set `booked_at` only when appropriate;
  - initialize booking payment state according to D6; and
  - append an audit event containing the service-request ID.
- Allow the forecast category to be edited after booking without erasing `booked_at`, removing the deal from Bookings, or lifting its delete protection.

**Tests**

- Same-client PO link succeeds; cross-client and non-PO links fail.
- A second PO for the same opportunity is rejected at the database boundary.
- Starting from Pipeline preselects and locks the correct row, then opens the PO details page.
- Starting from Transact requires either an eligible opportunity selection or complete new pipeline details.
- Creating through Transact populates Pipeline and links the PO in one successful transaction; failed or abandoned submission creates neither record.
- Completing an unlinked PO does not affect any opportunity.
- A linked PO cannot be completed through the generic action without invoice number/document.
- **Send invoice and complete** books exactly one opportunity and creates exactly one related invoice delivery request.
- Repeating the completed update is idempotent and does not duplicate history.
- Cancelling or editing an incomplete PO does not book the deal.
- The client can download and acknowledge the invoice; acknowledgement does not mark the booking Paid.
- Existing provider/request workflows continue working.
- End-to-end path: opportunity → linked PO → provider invoice return/completion → Booked state → client download/acknowledgement.

**Acceptance criteria**

- Booking is caused by the canonical completed state, not by a particular button implementation.
- No logistics handover flow is introduced.
- Opportunity revenue is not silently replaced by PO or invoice amount.

**Dependencies:** PRs 1–2.

### PR 4 — Bookings tracking and shared-field editing

**Goal:** Deliver the second view over the same deal source of truth.

**Scope**

- Add the approved bookings route, recommended as `/dashboard/sales/bookings`.
- Show the seven confirmed columns in the client-provided order.
- Query opportunities with a linked completed PO / permanent `booked_at`; do not use the current category label as the membership test and do not materialize/copy booking rows.
- Show the provider-entered invoice number read-only to clients.
- Let clients edit Revenue, Paid/Unpaid, Fiscal Week, Fiscal Quarter, and Fiscal Year in Bookings.
- Expose Paid/Unpaid to the assigned external provider only through the linked request detail, never through Sales navigation or tables.
- Add a compact, accessible Paid/Unpaid control with explicit server feedback.
- Maintain `paid_at` and audit events consistently.
- Make shared-field updates visible on both screens after mutation/revalidation.
- Add concurrency protection appropriate to the current data layer (updated-at/version check or equivalent) so one editor does not silently overwrite a newer edit.

**Tests**

- Deals without a linked completed PO are excluded, even if their category was manually set to `Booked`.
- Deals with a linked completed PO remain included if their editable category later changes.
- Allowed booking edits succeed; attempts to edit Deal ID/name/category through the booking action fail.
- Provider attempts to query Pipeline/Bookings or change revenue/fiscal fields fail; its narrow payment action succeeds only for its own completed linked PO.
- Revenue and fiscal changes in bookings appear in pipeline and vice versa.
- Paid/unpaid changes update timestamp and history correctly.
- Role/RLS tests cover client, sales, admin, operations, and provider expectations.
- End-to-end path: booked deal → add invoice → change revenue/week/quarter → mark paid → verify both views.

**Acceptance criteria**

- Pipeline and bookings cannot drift because they share a row.
- The bookings action whitelist is enforced server-side, not merely by disabled inputs.
- A full opportunity-to-paid lifecycle is covered by automated integration/E2E testing.

**Dependencies:** PRs 1–3.

### Future PRs — explicitly deferred

Do not fold these into PRs 1–4 without a new requirement pass:

- Sales, operations, or finance performance dashboards shown in the supplied mockups.
- QTD phasing, targets, slipped/commit/best-case calculations, cashflow, EBITDA, working capital, debt-to-equity, current ratio, churn, or service-request performance.
- Rename “Submit” to “Create” across Transact.
- New Create RFFA or Create RFQ transaction types.
- Logistics handover, invoice generation, accounting integrations, payment collection, or additional notifications beyond the existing request-delivery behaviour.
- Spreadsheet import/export.

Performance data visualisations will be planned as a separate tranche only after the four foundational PRs are complete and merged.

## 8. Decision gates

These are required client/product decisions. Do not conceal them with implementation guesses.

| ID | Decision | Recommended default | Why it matters |
| --- | --- | --- | --- |
| D1 — Decided | Navigation placement | Top-level **Sales**, containing **Pipeline** and **Bookings** | Confirmed by product owner |
| D2 — Decided | Who may see/edit Sales tables and booking fields? | Client alone sees the tables and edits revenue/expected-payment period; invoice number is read-only. External provider has no table access and uses narrow request-detail actions for invoice delivery and payment status. | Confirmed by product owner |
| D3 — Decided | Deal ID format and uniqueness scope | Globally unique `BLB-YYYY-NNNNNN`; not derived from source/category | Product owner delegated format choice |
| D4 — Decided | PO cardinality | Exactly one PO per opportunity | Confirmed by product owner |
| D5 — Decided | Fiscal period representation | Store reporting year + quarter 1–4 + quarter-relative week 1–13; use `Africa/Johannesburg` for event timestamps | Matches the workbook’s 13-week quarterly sales phasing without inventing an unsupported company tax-year boundary |
| D6 | Payment-state lifecycle | Unpaid when booked; Paid sets `paid_at`; reverting clears it but remains audited | Establishes initial state and audit behaviour |
| D7 — Decided | Deal deletion after booking/invoicing/payment | A deal with a completed linked PO, invoice, or payment history cannot be deleted | Confirmed by product owner; category changes do not remove this protection |
| D8 — Decided | Can a completed-PO deal move out of Booked manually? | Yes, but the permanent booking fact remains and the deal stays in Bookings | Confirmed by product owner |
| D9 | Invoice number uniqueness | Unique per client, case-insensitive, ignoring nulls | Avoids accidental duplicates without assuming global accounting numbering |
| D10 — Decided | Meaning of `Closed` | “Money in the bank”; automatically entered when Paid is set | Confirmed by the workbook and product owner |
| D11 | Opportunity-source values | Controlled lookup seeded with Team/Web | Allows later sources without inconsistent free text |
| D12 | Revenue tax/currency semantics | ZAR decimal value; clarify VAT inclusive/exclusive | Required for reliable reporting later |
| D13 — Decided | Should marking Paid automatically set forecast category to Closed? | Yes, with an audited transition; reverting to Unpaid does not silently reverse the category | Confirmed by product owner; workbook defines Closed as money in the bank |

## 9. Inputs still required

Before PR 1 schema is finalized:

1. The definition of `Open` and confirmation of the intended ordering/relationship between Upside and Best Case.
2. Confirmation of the initial Paid/Unpaid state, invoice-number uniqueness, source configuration, and revenue tax semantics.
3. Confirmation that the bookings screenshot represents the exact column set and that Opportunity Name is read-only there.

## 10. Cross-cutting engineering rules

- Create migrations through the repository’s migration workflow; never modify an already-applied migration.
- Run local Supabase reset and regenerate database types after schema changes.
- Enforce authorization, edit-field whitelists, and lifecycle invariants in the database/server boundary.
- Use decimal database types for money; never JavaScript floating-point arithmetic for stored amounts.
- Centralize fiscal-period rules; do not duplicate the current local table helper without confirming it matches the client calendar.
- Use SAST for user-facing date interpretation unless a tenant timezone is later introduced.
- Prefer auditable state transitions over silent overwrite.
- Preserve current user changes and rebase each feature branch on the latest merged `main`.
- Keep each PR narrow, include migration/rollback notes where applicable, and attach screenshots plus an explicit test report.

## 11. Definition of done for this tranche

The four-PR tranche is complete when:

- all four PRs are merged sequentially and CI is green;
- client RLS isolation is proven by tests;
- a client can create, edit, and safely remove/retire a pipeline opportunity;
- a linked completed PO moves exactly that opportunity to Booked;
- the booked deal appears once in bookings tracking;
- invoice/payment edits are restricted to approved roles and fields;
- shared revenue and fiscal-period edits are reflected in both views without copying or sync jobs;
- lifecycle/payment changes are auditable; and
- the opportunity → PO completion → booked → paid journey passes an automated end-to-end test.

## 12. Planning change log

| Date | Change |
| --- | --- |
| 2026-08-06 | Initial system mapping and four-PR implementation sequence recorded |
| 2026-08-06 | Added the supplied bookings layout: Deal ID, Opportunity Name, Invoice Number, Revenue, Paid/Unpaid, Fiscal Week, Fiscal Quarter |
| 2026-08-06 | Confirmed top-level Sales navigation, one PO per opportunity, stored fiscal year, editable category after booking, permanent delete protection, completed-PO-only bookings membership, and split invoice/payment permissions |
| 2026-08-06 | Reviewed `Blubook Sales Dash.xlsx`; recorded category definitions, preserved the newer Booked correction, and logged phasing sheets as deferred dashboard evidence |
| 2026-08-06 | Confirmed client-only Sales tables, external-provider invoice delivery, client-only revenue/fiscal editing, and invoice download/acknowledgement through a child document-delivery request; specified the PO-linking UX |
| 2026-08-06 | Replaced manual linking with symmetric entry paths: row-level Submit PO from Pipeline and a required create/select Pipeline transaction step in the regular PO flow |
| 2026-08-06 | Clarified one-way dependency: opportunities may remain in Pipeline without a PO; every PO must link to one opportunity |
| 2026-08-06 | Confirmed Paid automatically changes forecast category to Closed; reverting to Unpaid does not automatically reopen it |
| 2026-08-06 | Added a dedicated four-PR execution plan and explicitly sequenced performance visualisations after the foundational feature tranche |
