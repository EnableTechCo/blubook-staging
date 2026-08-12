import type { RequestRow } from "@/services/dashboard";

type RequestViewer = "client" | "provider" | "staff";

const TRANSACTION_TYPES = new Set(["sales_order", "purchase_order", "tender_submission"]);

// A document BluBook issued to the client, which stays open until they
// acknowledge receipt.
export function isDocumentDelivery(request: Pick<RequestRow, "request_type">): boolean {
  return request.request_type === "document_delivery";
}

export function isDocumentTransaction(request: Pick<RequestRow, "request_type">): boolean {
  return TRANSACTION_TYPES.has(request.request_type ?? "");
}

// The single SR Type shown across the app, merging how a request was raised
// (origin) with what kind of thing it is (request_type). The two are not
// independent: orders and tenders are only ever raised by a client, so these
// values describe every request without overlap.
//
//   system  + general           -> System
//   client  + general           -> Direct
//   client  + sales_order       -> Sales Order
//   client  + purchase_order    -> Purchase Order
//   client  + tender_submission -> Tender
//
// Sales and purchase orders are separate kinds rather than one "order": they
// run in opposite directions, and a tracker that merged them would show money
// coming in and money going out as the same line.
//
// origin stays in the database regardless: it drives the SYS-/CLI-/PRV-
// reference sequences and whether the ETA is static or variable.
export const REQUEST_KINDS = [
  "system",
  "direct",
  "sales_order",
  "purchase_order",
  "tender_submission",
] as const;

export type RequestKind = (typeof REQUEST_KINDS)[number];

export const REQUEST_KIND_LABEL: Record<RequestKind, string> = {
  system: "System",
  direct: "Direct",
  sales_order: "Sales Order",
  purchase_order: "Purchase Order",
  tender_submission: "Tender",
};

// Plural forms, for counting in the summary strips.
export const REQUEST_KIND_PLURAL: Record<RequestKind, string> = {
  system: "System",
  direct: "Direct",
  sales_order: "Sales orders",
  purchase_order: "Purchase orders",
  tender_submission: "Tenders",
};

export function requestKind(request: Pick<RequestRow, "origin" | "request_type">): RequestKind {
  if (request.request_type === "sales_order") return "sales_order";
  if (request.request_type === "purchase_order") return "purchase_order";
  if (request.request_type === "tender_submission") return "tender_submission";
  // Provider-raised requests are raised by hand too, so they read as Direct.
  return request.origin === "system" ? "system" : "direct";
}

export function requestKindLabel(request: Pick<RequestRow, "origin" | "request_type">): string {
  return REQUEST_KIND_LABEL[requestKind(request)];
}

// Who resolves the request, as a category rather than a name. BluBook's system
// owns auto-issued document deliveries even though the client performs the
// acknowledgement that closes them. A routed request is resolved by its
// Service Partner, or by the Work Group while it waits for one. Deliberately
// the same for every viewer: naming a partner here would leak its identity.
export function resolverLabel(
  request: Pick<RequestRow, "provider_id" | "services"> &
    Partial<Pick<RequestRow, "request_type">>,
): string {
  if (request.request_type === "document_delivery") return "System";
  if (request.provider_id) return "Service Partner";
  if (request.services?.service_groups?.name) return "Work Group";
  return "Unassigned";
}

export function requestStatusLabel(
  request: Pick<RequestRow, "request_type" | "status">,
  viewer: RequestViewer,
): string | undefined {
  // 'new' on a delivery means the document is with the client, not that nothing
  // has happened yet — so it needs its own wording.
  if (isDocumentDelivery(request)) {
    if (request.status === "new") {
      return viewer === "client" ? "Awaiting your acknowledgement" : "Awaiting acknowledgement";
    }
    if (request.status === "completed") return "Acknowledged";
    return undefined;
  }

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

// The client's Customer ID, shown identically to every role. It names nobody,
// so a partner learns no more from it than from the pseudonym it replaced —
// and staff can now search for the same reference a partner quotes them.
//
// This stays the primary label for everyone, including premium partners: the
// Customer ID is the identifier all three roles quote to each other, and
// swapping it for a business name would leave a premium partner unable to
// reference a client in the terms staff use.
export function clientLabel(request: Pick<RequestRow, "client_reference">): string {
  return request.client_reference ?? "—";
}

// The client's business name, or null where the anonymity rule still applies.
// Shown alongside the Customer ID rather than in place of it, and only ever
// non-null because client_references decided the caller was entitled — this
// function makes no access decision of its own.
export function clientIdentity(
  request: Pick<RequestRow, "client_business_name">,
): string | null {
  return request.client_business_name ?? null;
}
