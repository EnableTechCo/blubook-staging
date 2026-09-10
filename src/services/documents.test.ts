import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseFake, mockCreateClient } from "../../tests/stubs/supabaseFake";

describe("getDocumentArchive", () => {
  beforeEach(() => vi.resetModules());

  it("reads each document's folder from the caller's own filing, unfiled when there is none", async () => {
    const fake = makeSupabaseFake({
      documents: [{ data: [
        { id: "d1", title: "Tax clearance", category: "compliance", expires_at: null, created_at: "2026-09-01",
          document_filings: [{ category_id: "folder-A" }] },
        { id: "d2", title: "Quotation", category: "quotation", expires_at: null, created_at: "2026-09-02",
          document_filings: [] },
      ] }],
    });
    mockCreateClient(fake);
    const { getDocumentArchive } = await import("@/services/documents");

    const out = await getDocumentArchive();
    expect(out).toEqual([
      expect.objectContaining({ id: "d1", folder_id: "folder-A" }),
      expect.objectContaining({ id: "d2", folder_id: null }),
    ]);
    // The raw filings array does not leak into the view model.
    expect(out[0]).not.toHaveProperty("document_filings");
  });

  it("orders newest first", async () => {
    const fake = makeSupabaseFake({ documents: [{ data: [] }] });
    mockCreateClient(fake);
    const { getDocumentArchive } = await import("@/services/documents");
    await getDocumentArchive();
    expect(fake.argsOf("documents", "order")).toEqual([["created_at", { ascending: false }]]);
  });
});

describe("getDocumentFolders", () => {
  beforeEach(() => vi.resetModules());

  it("returns only active folders in sort order", async () => {
    const folders = [{ id: "f1", parent_id: null, slug: "root", name: "Root", sort_order: 0 }];
    const fake = makeSupabaseFake({ document_categories: [{ data: folders }] });
    mockCreateClient(fake);
    const { getDocumentFolders } = await import("@/services/documents");

    expect(await getDocumentFolders()).toEqual(folders);
    expect(fake.argsOf("document_categories", "eq")).toEqual([["active", true]]);
    expect(fake.argsOf("document_categories", "order")).toEqual([["sort_order"]]);
  });
});
