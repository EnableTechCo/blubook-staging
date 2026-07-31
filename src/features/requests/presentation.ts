import type { RequestRow } from "@/services/dashboard";

type RequestViewer = "client" | "provider" | "staff";

const TRANSACTION_TYPES = new Set(["purchase_order", "tender_submission"]);

export function isDocumentTransaction(request: Pick<RequestRow, "request_type">): boolean {
  return TRANSACTION_TYPES.has(request.request_type ?? "");
}

// The single SR Type shown across the app, merging how a request was raised
// (origin) with what kind of thing it is (request_type). The two are not
// independent: purchase orders and tenders are only ever raised by a client, so
// four values describe every request without overlap.
//
//   system  + general           -> System
//   client  + general           -> Direct
//   client  + purchase_order    -> Purchase Order
//   client  + tender_submission -> Tender
//
// origin stays in the database regardless: it drives the SYS-/CLI-/PRV-
// reference sequences and whether the ETA is static or variable.
export const REQUEST_KINDS = ["system", "direct", "purchase_order", "tender_submission"] as const;

export type RequestKind = (typeof REQUEST_KINDS)[number];

export const REQUEST_KIND_LABEL: Record<RequestKind, string> = {
  system: "System",
  direct: "Direct",
  purchase_order: "Purchase Order",
  tender_submission: "Tender",
};

// Plural forms, for counting in the summary strips.
export const REQUEST_KIND_PLURAL: Record<RequestKind, string> = {
  system: "System",
  direct: "Direct",
  purchase_order: "Purchase orders",
  tender_submission: "Tenders",
};

export function requestKind(request: Pick<RequestRow, "origin" | "request_type">): RequestKind {
  if (request.request_type === "purchase_order") return "purchase_order";
  if (request.request_type === "tender_submission") return "tender_submission";
  // Provider-raised requests are raised by hand too, so they read as Direct.
  return request.origin === "system" ? "system" : "direct";
}

export function requestKindLabel(request: Pick<RequestRow, "origin" | "request_type">): string {
  return REQUEST_KIND_LABEL[requestKind(request)];
}

export function requestStatusLabel(
  request: Pick<RequestRow, "request_type" | "status">,
  viewer: RequestViewer,
): string | undefined {
  if (!isDocumentTransaction(request)) return undefined;

  if (request.status === "new") return "Submitted";
  if (request.status === "awaiting_assignment") return "Awaiting partner";
  if (request.status === "open") {
    if (viewer === "provider") return "Action required";
    if (viewer === "staff") return "Offer open";
    return "Awaiting partner acceptance";
  }
  if (request.status === "assigned") return "Accepted";
  if (request.status === "in_progress") return "Under review";
  if (request.status === "completed") return "Approved";
  return undefined;
}
