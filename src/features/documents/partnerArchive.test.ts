import { describe, expect, it } from "vitest";
import {
  buildPartnerArchive,
  documentKind,
  type PartnerArchiveRow,
} from "@/features/documents/partnerArchive";

const ME = "partner-profile";
const CUSTOMER = "client-profile";
const STAFF = "staff-profile";

const req = (id: string, requestType: PartnerArchiveRow["request"]["requestType"], workOrder: string | null = "WO-000007") => ({
  id, reference: `SYS-${id}`, requestType, workOrder,
});

const row = (over: Partial<PartnerArchiveRow> & Pick<PartnerArchiveRow, "documentId">): PartnerArchiveRow => ({
  title: `Doc ${over.documentId}`,
  category: "other",
  uploadedBy: CUSTOMER,
  createdAt: "2026-09-01T10:00:00Z",
  request: req("r1", "general"),
  clientId: "cli-a",
  clientReference: "CUS-000001",
  clientBusinessName: null,
  ...over,
});

describe("documentKind", () => {
  it("reads an invoice as the one generated document the partner produced", () => {
    expect(documentKind({ category: "generated", uploadedBy: ME, request: req("r", "sales_order") }, ME)).toBe("invoice");
    expect(documentKind({ category: "generated", uploadedBy: STAFF, request: req("r", "document_delivery") }, ME)).toBe("issued");
  });

  it("files the partner's own uploads as deliverables whatever the request", () => {
    expect(documentKind({ category: "other", uploadedBy: ME, request: req("r", "tender_submission") }, ME)).toBe("deliverable");
  });

  it("files the customer's uploads by the kind of request they came with", () => {
    expect(documentKind({ category: "other", uploadedBy: CUSTOMER, request: req("r", "rffa") }, ME)).toBe("tender_pack");
    expect(documentKind({ category: "other", uploadedBy: CUSTOMER, request: req("r", "rfq") }, ME)).toBe("tender_pack");
    expect(documentKind({ category: "other", uploadedBy: CUSTOMER, request: req("r", "purchase_order") }, ME)).toBe("order");
    expect(documentKind({ category: "other", uploadedBy: CUSTOMER, request: req("r", "general") }, ME)).toBe("shared");
    expect(documentKind({ category: "compliance", uploadedBy: CUSTOMER, request: req("r", "general") }, ME)).toBe("compliance");
  });
});

describe("buildPartnerArchive", () => {
  const rows: PartnerArchiveRow[] = [
    row({ documentId: "d1", createdAt: "2026-09-01T10:00:00Z", request: req("r1", "tender_submission") }),
    row({ documentId: "d2", createdAt: "2026-09-03T10:00:00Z", uploadedBy: ME, request: req("r1", "tender_submission") }),
    row({ documentId: "d3", createdAt: "2026-09-02T10:00:00Z", category: "generated", uploadedBy: ME, request: req("r2", "sales_order", "WO-000009") }),
    // A second customer, seen by a premium partner, with older activity.
    row({ documentId: "d4", createdAt: "2026-08-20T10:00:00Z", clientId: "cli-b", clientReference: "CUS-000002", clientBusinessName: "Ridge Foods", request: req("r3", "general", null) }),
    // The same document linked twice must appear once.
    row({ documentId: "d1", createdAt: "2026-09-01T10:00:00Z", request: req("r9", "general") }),
  ];

  it("makes one folder per customer, most recently active first, named by the anonymity rule", () => {
    const folders = buildPartnerArchive(rows, ME);
    expect(folders.map((f) => [f.clientId, f.name, f.reference])).toEqual([
      ["cli-a", "CUS-000001", "CUS-000001"],
      ["cli-b", "Ridge Foods", "CUS-000002"],
    ]);
  });

  it("counts documents and requests once each", () => {
    const [a] = buildPartnerArchive(rows, ME);
    expect(a.documentCount).toBe(3);
    expect(a.requestCount).toBe(2);
    expect(a.lastActivity).toBe("2026-09-03T10:00:00Z");
  });

  it("groups by kind in display order, newest first inside a group, and skips empty kinds", () => {
    const [a] = buildPartnerArchive(rows, ME);
    expect(a.groups.map((g) => g.kind)).toEqual(["invoice", "deliverable", "tender_pack"]);
    expect(a.groups.find((g) => g.kind === "invoice")?.documents.map((d) => [d.id, d.from, d.request.workOrder])).toEqual([
      ["d3", "you", "WO-000009"],
    ]);
    expect(a.groups.find((g) => g.kind === "tender_pack")?.documents.map((d) => [d.id, d.from])).toEqual([["d1", "customer"]]);
  });

  it("falls back to 'Customer' when neither name nor reference resolved", () => {
    const [f] = buildPartnerArchive([row({ documentId: "x", clientReference: null })], ME);
    expect(f.name).toBe("Customer");
  });

  it("returns nothing for a partner with no documents", () => {
    expect(buildPartnerArchive([], ME)).toEqual([]);
  });
});
