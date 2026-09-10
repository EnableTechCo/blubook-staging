import { describe, expect, it, vi } from "vitest";
import { MAX_DOCUMENTS_PER_SUBMISSION } from "@/features/documents/uploadPolicy";
import {
  buildSubmission,
  collectFiles,
  submitTransactionForm,
  type SubmitContext,
  type SubmitDeps,
} from "@/features/transact/submitTransaction";

// This is the coverage #156 could not deliver: the submit orchestration, run
// with its collaborators handed in, no form, no jsdom submission event.

const pdf = (name = "po.pdf", size = 64) => new File([new Uint8Array(size)], name, { type: "application/pdf" });
const form = (entries: Record<string, string | File | File[]>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (Array.isArray(v)) v.forEach((f) => fd.append(k, f));
    else fd.set(k, v);
  }
  return fd;
};
const prepared = (locator: string) => ({ bucket: "documents" as const, locator, objectPath: locator, token: "t" });
const deps = (over: Partial<SubmitDeps> = {}): SubmitDeps => ({
  prepare: vi.fn(async (f) => ({ ok: true as const, upload: prepared(`cli/${f.name}`) })),
  upload: vi.fn(async ({ file, prepared: p }) => ({ locator: p.locator, title: file.name, mimeType: file.type, sizeBytes: file.size })),
  submitTransaction: vi.fn(async () => ({ ok: true as const, reference: "SR-0042", requestId: "req-1" })),
  onProgress: vi.fn(),
  ...over,
});
const ctx = (over: Partial<SubmitContext> = {}): SubmitContext => ({ kind: "purchase_order", opportunityMode: "new", ...over });

describe("collectFiles", () => {
  it("requires at least one non-empty file", () => {
    expect(collectFiles(form({}))).toEqual({ error: "Attach at least one document." });
    expect(collectFiles(form({ documents: pdf("empty.pdf", 0) }))).toEqual({ error: "Attach at least one document." });
  });

  it("caps the count at the policy limit", () => {
    const many = Array.from({ length: MAX_DOCUMENTS_PER_SUBMISSION + 1 }, (_, i) => pdf(`f${i}.pdf`));
    expect(collectFiles(form({ documents: many }))).toEqual({ error: `Attach no more than ${MAX_DOCUMENTS_PER_SUBMISSION} documents.` });
  });

  it("names the offending file when the policy rejects it", () => {
    const exe = new File([new Uint8Array(10)], "virus.exe", { type: "application/x-msdownload" });
    const out = collectFiles(form({ documents: [pdf(), exe] }));
    expect("error" in out && out.error.startsWith("virus.exe: ")).toBe(true);
  });

  it("returns the files in order when all pass", () => {
    const out = collectFiles(form({ documents: [pdf("a.pdf"), pdf("b.pdf")] }));
    expect("files" in out && out.files.map((f) => f.name)).toEqual(["a.pdf", "b.pdf"]);
  });
});

describe("buildSubmission", () => {
  const uploaded = [{ locator: "cli/a.pdf", title: "a", mimeType: "application/pdf", sizeBytes: 1 }];

  it("shapes a purchase order with ZAR and no pipeline fields", () => {
    const out = buildSubmission(form({ purchaseOrderNumber: "PO-1", supplier: "Acme", description: "Paper" }), ctx(), uploaded);
    expect(out).toMatchObject({ kind: "purchase_order", currency: "ZAR", purchaseOrderNumber: "PO-1", supplier: "Acme", files: uploaded });
    expect(out).not.toHaveProperty("opportunityId");
    expect(out).not.toHaveProperty("newOpportunity");
  });

  it("a sales order in existing mode carries the chosen opportunity and no new one", () => {
    const out = buildSubmission(form({ salesOrderNumber: "SO-1", opportunityId: "opp-9" }), ctx({ kind: "sales_order", opportunityMode: "existing" }), uploaded);
    expect(out).toMatchObject({ kind: "sales_order", opportunityId: "opp-9", newOpportunity: undefined });
  });

  it("a sales order in new mode carries the new-opportunity block with fiscal fields stringified", () => {
    const out = buildSubmission(
      form({ salesOrderNumber: "SO-1", opportunitySource: "referral", opportunityName: "Q3", forecastCategory: "open", revenue: "1200", fiscalYear: "2026" }),
      ctx({ kind: "sales_order", opportunityMode: "new" }),
      uploaded,
    );
    expect(out).toMatchObject({
      opportunityId: undefined,
      newOpportunity: { opportunitySource: "referral", opportunityName: "Q3", forecastCategory: "open", revenue: "1200", fiscalYear: "2026", fiscalQuarter: "", fiscalWeek: "" },
    });
  });

  it("a locked opportunity wins over the form's mode, and suppresses a new one", () => {
    const out = buildSubmission(
      form({ salesOrderNumber: "SO-1", opportunityId: "opp-from-form", opportunityName: "should be ignored" }),
      ctx({ kind: "sales_order", opportunityMode: "new", lockedOpportunityId: "opp-locked" }),
      uploaded,
    );
    expect(out).toMatchObject({ opportunityId: "opp-locked", newOpportunity: undefined });
  });

  it.each(["tender_submission", "rffa", "rfq"] as const)("%s shares the tender shape", (kind) => {
    const out = buildSubmission(form({ tenderReference: "T-1", tenderTitle: "Roads", issuer: "SANRAL", closingAt: "2026-10-01T10:00" }), ctx({ kind }), uploaded);
    expect(out).toEqual({ kind, closingAt: "2026-10-01T10:00", files: uploaded, issuer: "SANRAL", notes: null, tenderReference: "T-1", tenderTitle: "Roads" });
  });
});

describe("submitTransactionForm", () => {
  const fd = () => form({ purchaseOrderNumber: "PO-1", supplier: "Acme", description: "Paper", documents: [pdf("a.pdf"), pdf("b.pdf")] });

  it("prepares and uploads each file in order, reports progress by index, then submits", async () => {
    const d = deps({
      upload: vi.fn(async ({ file, prepared: p, onProgress }) => {
        onProgress(50); onProgress(100);
        return { locator: p.locator, title: file.name, mimeType: file.type, sizeBytes: file.size };
      }),
    });

    const out = await submitTransactionForm(fd(), ctx(), d);

    expect(out).toEqual({ ok: true, reference: "SR-0042" });
    expect(d.prepare).toHaveBeenNthCalledWith(1, { name: "a.pdf", size: 64, type: "application/pdf" });
    expect(d.prepare).toHaveBeenNthCalledWith(2, { name: "b.pdf", size: 64, type: "application/pdf" });
    expect((d.onProgress as ReturnType<typeof vi.fn>).mock.calls).toEqual([[0, 50], [0, 100], [1, 50], [1, 100]]);
    const payload = (d.submitTransaction as ReturnType<typeof vi.fn>).mock.calls[0][0] as { files: { locator: string }[] };
    expect(payload.files.map((f) => f.locator)).toEqual(["cli/a.pdf", "cli/b.pdf"]);
  });

  it("stops at validation without preparing anything", async () => {
    const d = deps();
    expect(await submitTransactionForm(form({}), ctx(), d)).toEqual({ ok: false, error: "Attach at least one document.", stage: "validation" });
    expect(d.prepare).not.toHaveBeenCalled();
  });

  it("stops at the first file that cannot be prepared, uploading nothing", async () => {
    const d = deps({ prepare: vi.fn(async () => ({ ok: false as const, error: "That file type is not accepted." })) });
    expect(await submitTransactionForm(fd(), ctx(), d)).toEqual({ ok: false, error: "That file type is not accepted.", stage: "prepare" });
    expect(d.upload).not.toHaveBeenCalled();
    expect(d.submitTransaction).not.toHaveBeenCalled();
  });

  it("stops when an upload throws, and does not submit a partial set", async () => {
    const d = deps({ upload: vi.fn(async () => { throw new Error("network reset"); }) });
    expect(await submitTransactionForm(fd(), ctx(), d)).toEqual({ ok: false, error: "network reset", stage: "upload" });
    expect(d.submitTransaction).not.toHaveBeenCalled();
  });

  it("returns the action's refusal as a submit-stage error", async () => {
    const d = deps({ submitTransaction: vi.fn(async () => ({ ok: false as const, error: "Purchase order submission is not configured yet." })) });
    expect(await submitTransactionForm(fd(), ctx(), d)).toEqual({ ok: false, error: "Purchase order submission is not configured yet.", stage: "submit" });
  });
});
