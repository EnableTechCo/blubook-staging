import { describe, expect, it } from "vitest";
import { MAX_DOCUMENTS_PER_SUBMISSION } from "@/features/documents/uploadPolicy";
import { submissionSchema, summary } from "@/features/transact/submissionSchema";

const file = (n = 1) => ({ locator: `docs/${n}.pdf`, title: `Doc ${n}`, mimeType: "application/pdf", sizeBytes: 1024 });

describe("submissionSchema", () => {
  it("requires at least one attachment and caps them at the policy limit", () => {
    const base = { kind: "purchase_order", purchaseOrderNumber: "PO-1", supplier: "Acme", description: "Paper" };
    expect(submissionSchema.safeParse({ ...base, files: [] }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...base, files: [file()] }).success).toBe(true);
    const tooMany = Array.from({ length: MAX_DOCUMENTS_PER_SUBMISSION + 1 }, (_, i) => file(i));
    expect(submissionSchema.safeParse({ ...base, files: tooMany }).success).toBe(false);
  });

  it("defaults the currency to ZAR on both order kinds", () => {
    const po = submissionSchema.parse({ kind: "purchase_order", purchaseOrderNumber: "PO-1", supplier: "Acme", description: "x", files: [file()] });
    const so = submissionSchema.parse({ kind: "sales_order", salesOrderNumber: "SO-1", supplier: "Acme", description: "x", files: [file()] });
    expect(po.kind === "purchase_order" && po.currency).toBe("ZAR");
    expect(so.kind === "sales_order" && so.currency).toBe("ZAR");
  });

  it("gives RFFA and RFQ the same shape as a tender submission", () => {
    const body = { closingAt: "2026-10-01", files: [file()], issuer: "SANRAL", tenderReference: "T-1", tenderTitle: "Roads" };
    for (const kind of ["tender_submission", "rffa", "rfq"] as const) {
      expect(submissionSchema.safeParse({ kind, ...body }).success).toBe(true);
    }
  });

  it("rejects an unknown kind outright", () => {
    expect(submissionSchema.safeParse({ kind: "invoice", files: [file()] }).success).toBe(false);
  });
});

describe("summary", () => {
  it("writes a sales order with every optional line present", () => {
    const out = summary({
      kind: "sales_order", salesOrderNumber: "SO-42", supplier: "Riverside Cafe", amount: "1250.00",
      currency: "zar", description: "Coffee beans, 20kg.", notes: "Deliver before 8am.", requiredDate: "2026-09-30", files: [file()],
    });
    expect(out.title).toBe("Sales order SO-42");
    expect(out.description).toBe(
      ["Sales order: SO-42", "Supplier or recipient: Riverside Cafe", "Amount: ZAR 1250.00",
       "Required date: 2026-09-30", "", "Coffee beans, 20kg.", "\nNotes:\nDeliver before 8am."].join("\n"),
    );
  });

  it("omits the optional lines it was not given, without leaving gaps", () => {
    const out = summary({ kind: "purchase_order", purchaseOrderNumber: "PO-7", supplier: "Acme", currency: "ZAR", description: "Paper", files: [file()] });
    expect(out.title).toBe("Purchase order PO-7");
    expect(out.description).toBe(["Purchase order: PO-7", "Supplier: Acme", "", "Paper"].join("\n"));
    expect(out.description).not.toMatch(/Amount|Required|Notes/);
  });

  it.each([
    ["tender_submission", "Tender"],
    ["rffa", "RFFA"],
    ["rfq", "RFQ"],
  ] as const)("labels a %s by its kind and falls back when there are no notes", (kind, label) => {
    const out = summary({ kind, files: [file()], issuer: "SANRAL", tenderReference: "T-9", tenderTitle: "Bridge works" });
    expect(out.title).toBe("T-9 · Bridge works");
    expect(out.description.split("\n")[0]).toBe(`${label} reference: T-9`);
    expect(out.description).toContain("No additional notes supplied.");
    expect(out.description).not.toContain("Closing date");
  });
});
