// Shared between the submission action and the generic service picker.
//
// This deliberately lives outside submissionActions.ts: that file is
// "use server", and such a module may only export async functions — exporting a
// plain object from it fails at runtime, not at build time.

export type TransactionKind = "purchase_order" | "tender_submission" | "rffa" | "rfq";

// The catalogue service each transaction kind is raised against. RFFA and RFQ
// resolve to services in the Tender work group, so routing matches a Tender
// partner exactly as it does for a tender submission.
export const SERVICE_SLUGS: Record<TransactionKind, string> = {
  purchase_order: "purchase-order-submission",
  tender_submission: "tender-submission",
  rffa: "rffa-submission",
  rfq: "rfq-submission",
};

// What each kind is called wherever a submission is described to a person.
export const KIND_LABEL: Record<TransactionKind, string> = {
  purchase_order: "Purchase order",
  tender_submission: "Tender",
  rffa: "RFFA",
  rfq: "RFQ",
};
