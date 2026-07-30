import type { RequestRow } from "@/services/dashboard";

type RequestViewer = "client" | "provider" | "staff";

const TRANSACTION_TYPES = new Set(["purchase_order", "tender_submission"]);

export function isDocumentTransaction(request: Pick<RequestRow, "request_type">): boolean {
  return TRANSACTION_TYPES.has(request.request_type ?? "");
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
