import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseFake } from "../../../tests/stubs/supabaseFake";

// Follows features/auth/actions.test.ts: hoisted mocks, redirect throws so a
// refused delete is observable, revalidatePath is a spy.
const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  getCurrentProfile: vi.fn(),
  redirect: vi.fn((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); }),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/services/profiles", () => ({ getCurrentProfile: mocks.getCurrentProfile }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { createFolder, deleteFolder, fileDocument, uploadDocument } from "@/features/documents/actions";

const UUID = "3f1a6d2e-1c4b-4a9e-9c3d-0b7a5e2f8c41";
const UUID2 = "9c2b0f5a-77d4-4f21-8f0e-2a6d1b3c4e50";

const form = (entries: Record<string, string | File>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};
const pdf = (name = "invoice.pdf", size = 2048) =>
  new File([new Uint8Array(size)], name, { type: "application/pdf" });

/** Two fakes: the session client (RLS) and the admin client (bypasses RLS). */
function wire(session: ReturnType<typeof makeSupabaseFake>, admin: ReturnType<typeof makeSupabaseFake>) {
  mocks.createClient.mockResolvedValue(session.client);
  mocks.createAdminClient.mockReturnValue(admin.client);
}

beforeEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
describe("uploadDocument", () => {
  it("refuses a partner — only clients and staff upload", async () => {
    mocks.getCurrentProfile.mockResolvedValue({ id: "p", user_type: "service_provider" });
    expect(await uploadDocument(undefined, form({ title: "x", category: "other", file: pdf() })))
      .toEqual({ error: "Not authorized to upload" });
  });

  it("refuses an empty file and an oversized one before touching anything", async () => {
    mocks.getCurrentProfile.mockResolvedValue({ id: "p", user_type: "client" });
    expect(await uploadDocument(undefined, form({ title: "x", category: "other", file: pdf("e.pdf", 0) })))
      .toEqual({ error: "Choose a file to upload" });
    expect(await uploadDocument(undefined, form({ title: "x", category: "other", file: pdf("big.pdf", 10 * 1024 * 1024 + 1) })))
      .toEqual({ error: "File exceeds the 10MB limit" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("a client uploads to its own account and files the document in its own tree", async () => {
    mocks.getCurrentProfile.mockResolvedValue({ id: "prof-1", user_type: "client" });
    const session = makeSupabaseFake({ clients: [{ data: { id: "cli-1" } }], document_filings: [{ data: null }] });
    const admin = makeSupabaseFake({ documents: [{ data: { id: "doc-1" } }] });
    wire(session, admin);

    const out = await uploadDocument(undefined, form({ title: "Tax clearance", category: "compliance", folderId: UUID, file: pdf() }));

    expect(out).toEqual({ ok: true });
    expect(admin.uploaded[0]).toMatchObject({ bucket: "documents", contentType: "application/pdf" });
    expect(admin.uploaded[0].path).toMatch(/^cli-1\/[0-9a-f-]+-invoice\.pdf$/);
    expect(admin.argsOf("documents", "insert")[0][0]).toMatchObject({ client_id: "cli-1", uploaded_by: "prof-1", title: "Tax clearance", category: "compliance" });
    // Filed under the SESSION client so RLS proves the folder is theirs
    expect(session.argsOf("document_filings", "upsert")[0][0]).toMatchObject({ document_id: "doc-1", owner_profile_id: "prof-1", category_id: UUID });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/documents");
  });

  it("staff must name the client, and never files into a tree they do not have", async () => {
    mocks.getCurrentProfile.mockResolvedValue({ id: "staff-1", user_type: "staff" });
    const session = makeSupabaseFake();
    const admin = makeSupabaseFake({ documents: [{ data: { id: "doc-1" } }] });
    wire(session, admin);

    expect(await uploadDocument(undefined, form({ title: "x", category: "other", file: pdf() })))
      .toEqual({ error: "A client must be specified" });

    await uploadDocument(undefined, form({ title: "x", category: "other", clientId: UUID, folderId: UUID2, file: pdf() }));
    expect(session.from).not.toHaveBeenCalledWith("document_filings");
    expect(admin.argsOf("documents", "insert")[0][0]).toMatchObject({ client_id: UUID, uploaded_by: "staff-1" });
  });

  it("rolls the orphaned file back when the metadata insert fails", async () => {
    mocks.getCurrentProfile.mockResolvedValue({ id: "p", user_type: "client" });
    const session = makeSupabaseFake({ clients: [{ data: { id: "cli-1" } }] });
    const admin = makeSupabaseFake({ documents: [{ data: null, error: { message: "check violation" } }] });
    wire(session, admin);

    expect(await uploadDocument(undefined, form({ title: "x", category: "other", file: pdf() })))
      .toEqual({ error: "check violation" });
    expect(admin.removed).toEqual([{ bucket: "documents", paths: [admin.uploaded[0].path] }]);
  });

  it("rolls back BOTH the row and the file when linking to the request fails", async () => {
    mocks.getCurrentProfile.mockResolvedValue({ id: "p", user_type: "staff" });
    const session = makeSupabaseFake();
    const admin = makeSupabaseFake({
      documents: [{ data: { id: "doc-1" } }, { data: null }],
      request_documents: [{ data: null, error: { message: "no such request" } }],
    });
    wire(session, admin);

    expect(await uploadDocument(undefined, form({ title: "x", category: "other", clientId: UUID, requestId: UUID2, file: pdf() })))
      .toEqual({ error: "no such request" });
    expect(admin.argsOf("documents", "delete")).toHaveLength(1);
    expect(admin.argsOf("documents", "eq")).toContainEqual(["id", "doc-1"]);
    expect(admin.removed).toHaveLength(1);
  });

  describe("a client uploading against a compliance checklist item", () => {
    const item = (over: Record<string, unknown> = {}) => ({
      id: UUID, document_type_id: "type-1", status: "outstanding",
      onboardings: { client_id: "cli-1", compliance_request_id: UUID2 }, ...over,
    });
    const submit = () => uploadDocument(undefined, form({
      title: "CIPC", category: "other", onboardingDocumentId: UUID, requestId: UUID2, file: pdf(),
    }));

    beforeEach(() => mocks.getCurrentProfile.mockResolvedValue({ id: "prof-1", user_type: "client" }));

    it("accepts it, forces the category to compliance, and marks the item received", async () => {
      const session = makeSupabaseFake({ clients: [{ data: { id: "cli-1" } }] });
      const admin = makeSupabaseFake({ onboarding_documents: [{ data: item() }, { data: null }], documents: [{ data: { id: "doc-1" } }], request_documents: [{ data: null }] });
      wire(session, admin);

      expect(await submit()).toEqual({ ok: true });
      expect(admin.argsOf("documents", "insert")[0][0]).toMatchObject({ category: "compliance", document_type_id: "type-1", onboarding_document_id: UUID });
      expect(admin.argsOf("onboarding_documents", "update")[0][0]).toEqual({ status: "received" });
    });

    it.each([
      ["another client's item", { onboardings: { client_id: "cli-OTHER", compliance_request_id: UUID2 } }],
      ["an item already verified", { status: "verified" }],
      ["an item on a different compliance thread", { onboardings: { client_id: "cli-1", compliance_request_id: "3a3a3a3a-0000-4000-8000-000000000000" } }],
    ])("refuses %s without uploading anything", async (_label, over) => {
      const session = makeSupabaseFake({ clients: [{ data: { id: "cli-1" } }] });
      const admin = makeSupabaseFake({ onboarding_documents: [{ data: item(over) }] });
      wire(session, admin);

      expect(await submit()).toEqual({ error: "This checklist item is not available for your account" });
      expect(admin.uploaded).toEqual([]);
    });

    it("refuses a request upload that names no checklist item", async () => {
      const session = makeSupabaseFake({ clients: [{ data: { id: "cli-1" } }] });
      wire(session, makeSupabaseFake());
      expect(await uploadDocument(undefined, form({ title: "x", category: "other", requestId: UUID2, file: pdf() })))
        .toEqual({ error: "This request does not accept this upload" });
    });
  });
});

// ---------------------------------------------------------------------------
describe("folders", () => {
  beforeEach(() => mocks.getCurrentProfile.mockResolvedValue({ id: "prof-1", user_type: "client" }));

  it("createFolder keeps the tree two levels deep", async () => {
    const session = makeSupabaseFake({ document_categories: [{ data: { parent_id: "grandparent" } }] });
    wire(session, makeSupabaseFake());

    await createFolder(form({ name: "Deep", parentId: UUID }));
    expect(session.argsOf("document_categories", "insert")).toEqual([]);
  });

  it("createFolder de-duplicates the slug within the owner's tree", async () => {
    const session = makeSupabaseFake({
      document_categories: [{ data: [{ slug: "invoices" }, { slug: "invoices-2" }] }, { data: null }],
    });
    wire(session, makeSupabaseFake());

    await createFolder(form({ name: "Invoices" }));
    expect(session.argsOf("document_categories", "insert")[0][0]).toMatchObject({ owner_profile_id: "prof-1", name: "Invoices", slug: "invoices-3", parent_id: null });
    expect(session.argsOf("document_categories", "like")).toEqual([["slug", "invoices%"]]);
  });

  it("createFolder does nothing for staff, who have no tree", async () => {
    mocks.getCurrentProfile.mockResolvedValue({ id: "s", user_type: "staff" });
    await createFolder(form({ name: "Nope" }));
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("deleteFolder refuses while the folder still holds anything, and says so via redirect", async () => {
    const session = makeSupabaseFake({ document_categories: [{ count: 1 }], document_filings: [{ count: 0 }] });
    wire(session, makeSupabaseFake());

    await expect(deleteFolder(form({ folderId: UUID }))).rejects.toThrow(/NEXT_REDIRECT:\/dashboard\/documents\?error=/);
    expect(session.argsOf("document_categories", "delete")).toEqual([]);
  });

  it("deleteFolder removes an empty folder", async () => {
    const session = makeSupabaseFake({ document_categories: [{ count: 0 }, { data: null }], document_filings: [{ count: 0 }] });
    wire(session, makeSupabaseFake());

    await deleteFolder(form({ folderId: UUID }));
    expect(session.argsOf("document_categories", "delete")).toHaveLength(1);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("fileDocument files into a folder, or unfiles when no folder is given", async () => {
    const session = makeSupabaseFake({ document_filings: [{ data: null }, { data: null }] });
    wire(session, makeSupabaseFake());

    await fileDocument(form({ documentId: UUID, folderId: UUID2 }));
    expect(session.argsOf("document_filings", "upsert")[0][0]).toEqual({ document_id: UUID, owner_profile_id: "prof-1", category_id: UUID2 });

    await fileDocument(form({ documentId: UUID }));
    expect(session.argsOf("document_filings", "delete")).toHaveLength(1);
    expect(session.argsOf("document_filings", "eq")).toEqual([["document_id", UUID], ["owner_profile_id", "prof-1"]]);
  });
});
