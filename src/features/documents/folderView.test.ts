import { describe, expect, it } from "vitest";
import { buildFolderView, UNFILED } from "@/features/documents/folderView";
import type { DocumentFolder, DocumentRow } from "@/services/documents";

const folder = (id: string, parent_id: string | null = null): DocumentFolder =>
  ({ id, parent_id, slug: id, name: id, sort_order: 0 });
const doc = (id: string, folder_id: string | null): DocumentRow =>
  ({ id, title: id, category: "other", expires_at: null, created_at: "2026-09-01", folder_id });

// Two parents; "tax" has a child. Six documents spread across the tree.
const folders = [folder("tax"), folder("tax-2025", "tax"), folder("hr")];
const documents = [
  doc("d1", "tax"), doc("d2", "tax-2025"), doc("d3", "tax-2025"),
  doc("d4", "hr"),
  doc("d5", null), doc("d6", null),
];

describe("buildFolderView", () => {
  it("separates parents from children", () => {
    const v = buildFolderView({ folders, documents, folderParam: undefined });
    expect(v.parents.map((f) => f.id)).toEqual(["tax", "hr"]);
    expect(v.childrenOf("tax").map((f) => f.id)).toEqual(["tax-2025"]);
    expect(v.childrenOf("hr")).toEqual([]);
  });

  it("counts a parent's documents INCLUDING those filed under its children", () => {
    const v = buildFolderView({ folders, documents, folderParam: undefined });
    expect(v.countUnder(folder("tax"))).toBe(3);        // d1 + d2 + d3
    expect(v.countUnder(folder("tax-2025", "tax"))).toBe(2);
    expect(v.countUnder(folder("hr"))).toBe(1);
    expect(v.unfiledCount).toBe(2);
  });

  it("shows folders, not documents, at the root", () => {
    const v = buildFolderView({ folders, documents, folderParam: undefined });
    expect(v.current).toBeNull();
    expect(v.isUnfiledView).toBe(false);
    expect(v.visibleDocs).toEqual([]);
  });

  it("shows only a folder's OWN documents when viewing it, not its children's", () => {
    const v = buildFolderView({ folders, documents, folderParam: "tax" });
    expect(v.current?.id).toBe("tax");
    expect(v.visibleDocs.map((d) => d.id)).toEqual(["d1"]);
  });

  it("treats the unfiled sentinel as a view, never as a folder id", () => {
    const v = buildFolderView({ folders, documents, folderParam: UNFILED });
    expect(v.isUnfiledView).toBe(true);
    expect(v.current).toBeNull();
    expect(v.visibleDocs.map((d) => d.id)).toEqual(["d5", "d6"]);
  });

  it("resolves an unknown folder id to the root view rather than throwing", () => {
    const v = buildFolderView({ folders, documents, folderParam: "does-not-exist" });
    expect(v.current).toBeNull();
    expect(v.visibleDocs).toEqual([]);
  });

  it("is stable with no folders and no documents at all", () => {
    const v = buildFolderView({ folders: [], documents: [], folderParam: undefined });
    expect(v.parents).toEqual([]);
    expect(v.unfiledCount).toBe(0);
    expect(v.visibleDocs).toEqual([]);
  });
});
