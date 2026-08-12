import { describe, expect, it } from "vitest";
import {
  clientIdentity,
  clientLabel,
  requestKind,
  requestKindLabel,
  resolverLabel,
} from "@/features/requests/presentation";

const withGroup = { name: "Bookkeeping", service_groups: { name: "Finance Group" } };

// Shared by the tracker table and the request detail page, so both read the
// same value. It names a kind of party, never a business.
describe("resolverLabel", () => {
  it("reads Service Partner once a partner holds the request", () => {
    expect(resolverLabel({ provider_id: "p-1", services: withGroup })).toBe("Service Partner");
  });

  it("reads Work Group while the request waits in the group queue", () => {
    expect(resolverLabel({ provider_id: null, services: withGroup })).toBe("Work Group");
  });

  it("reads Unassigned when no work group owns the service", () => {
    expect(resolverLabel({ provider_id: null, services: { name: "Bookkeeping" } })).toBe(
      "Unassigned",
    );
  });

  it("does not vary by viewer, so it can never leak the partner's identity", () => {
    const request = { provider_id: "p-1", services: withGroup };
    // One call, one answer — there is no viewer parameter to differ on.
    expect(resolverLabel(request)).toBe("Service Partner");
    expect(resolverLabel(request)).not.toContain("Your team");
  });
});

// The merged SR Type. origin says how the request was raised, request_type says
// what kind of thing it is; sales orders and tenders only ever arrive
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

  it("reads a sales order as its own kind rather than direct", () => {
    expect(requestKind({ origin: "client", request_type: "sales_order" })).toBe("sales_order");
    expect(requestKindLabel({ origin: "client", request_type: "sales_order" })).toBe(
      "Sales Order",
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
    expect(requestKind({ origin: "system", request_type: "sales_order" })).toBe("sales_order");
  });
});

// The Customer ID replaced a per-viewer pseudonym. It is the same value for
// everyone, which is what lets a partner quote a reference staff can search on.
describe("clientLabel", () => {
  it("shows the Customer ID", () => {
    expect(clientLabel({ client_reference: "CUS-000012" })).toBe("CUS-000012");
  });

  it("does not vary by viewer — there is no viewer argument to vary on", () => {
    const request = { client_reference: "CUS-000012" };
    expect(clientLabel(request)).toBe(clientLabel(request));
    expect(clientLabel(request)).not.toMatch(/^Client-/);
  });

  it("falls back when the lookup returned nothing", () => {
    expect(clientLabel({ client_reference: null })).toBe("—");
  });

  // Premium partners get the business name in addition to the Customer ID, not
  // instead of it: the Customer ID is what all three roles quote to each other.
  it("still shows the Customer ID when the viewer may also see the identity", () => {
    expect(clientLabel({ client_reference: "CUS-000012" })).toBe("CUS-000012");
  });
});

// Whether the name is present at all is decided in the database, by
// client_references. This function only renders what it was given, so the
// anonymity rule cannot be re-implemented — or forgotten — in the UI.
describe("clientIdentity", () => {
  it("shows the business name when the view supplied one", () => {
    expect(clientIdentity({ client_business_name: "Maboneng Trading" })).toBe("Maboneng Trading");
  });

  it("returns null when the viewer is not entitled to it", () => {
    expect(clientIdentity({ client_business_name: null })).toBeNull();
  });

  it("returns null when the field is absent entirely", () => {
    expect(clientIdentity({})).toBeNull();
  });

  it("never falls back to a placeholder that would imply a name exists", () => {
    // clientLabel renders an em dash for a missing Customer ID. Doing the same
    // here would put a visible empty "Client" row on a partner's screen and
    // invite the reader to think the name was withheld by accident.
    expect(clientIdentity({ client_business_name: null })).not.toBe("—");
  });
});
