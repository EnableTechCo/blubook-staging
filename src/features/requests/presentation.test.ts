import { describe, expect, it } from "vitest";
import { requestKind, requestKindLabel } from "@/features/requests/presentation";

// The merged SR Type. origin says how the request was raised, request_type says
// what kind of thing it is; purchase orders and tenders only ever arrive
// client-raised, so four values cover every combination without overlap.
describe("requestKind", () => {
  it("reads a package-generated request as system", () => {
    expect(requestKind({ origin: "system", request_type: "general" })).toBe("system");
    expect(requestKindLabel({ origin: "system", request_type: "general" })).toBe("System");
  });

  it("reads a hand-raised service request as direct", () => {
    expect(requestKind({ origin: "client", request_type: "general" })).toBe("direct");
    expect(requestKindLabel({ origin: "client", request_type: "general" })).toBe("Direct");
  });

  it("reads a purchase order as its own kind rather than direct", () => {
    expect(requestKind({ origin: "client", request_type: "purchase_order" })).toBe("purchase_order");
    expect(requestKindLabel({ origin: "client", request_type: "purchase_order" })).toBe(
      "Purchase Order",
    );
  });

  it("reads a tender as its own kind", () => {
    expect(requestKind({ origin: "client", request_type: "tender_submission" })).toBe(
      "tender_submission",
    );
    expect(requestKindLabel({ origin: "client", request_type: "tender_submission" })).toBe("Tender");
  });

  it("treats a provider-raised request as direct, since it is raised by hand", () => {
    expect(requestKind({ origin: "provider", request_type: "general" })).toBe("direct");
  });

  it("lets the transaction type win over origin, so a PO never reads as System", () => {
    // Not reachable through the app — submissionActions always writes
    // origin 'client' — but the merge must not silently mislabel it.
    expect(requestKind({ origin: "system", request_type: "purchase_order" })).toBe("purchase_order");
  });
});
