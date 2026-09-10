import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseFake } from "../../../tests/stubs/supabaseFake";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  getCurrentProfile: vi.fn(),
  revalidatePath: vi.fn(),
  removeUploadedDocuments: vi.fn(async () => undefined),
  verifyUploadedDocuments: vi.fn(),
  persistRequestDocuments: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/services/profiles", () => ({ getCurrentProfile: mocks.getCurrentProfile }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/features/documents/requestAttachments", () => ({
  removeUploadedDocuments: mocks.removeUploadedDocuments,
  verifyUploadedDocuments: mocks.verifyUploadedDocuments,
  persistRequestDocuments: mocks.persistRequestDocuments,
}));

import { submitDocumentTransaction } from "@/features/transact/submissionActions";

const UUID = "3f1a6d2e-1c4b-4a9e-9c3d-0b7a5e2f8c41";
const files = [{ locator: "cli-1/a.pdf", title: "A", mimeType: "application/pdf", sizeBytes: 100 }];
const tender = { kind: "tender_submission", files, issuer: "SANRAL", tenderReference: "T-1", tenderTitle: "Roads" };
const salesOrder = (over: Record<string, unknown> = {}) => ({
  kind: "sales_order", salesOrderNumber: "SO-1", supplier: "Acme", description: "Beans", files, ...over,
});

function wire(session: ReturnType<typeof makeSupabaseFake>, admin = makeSupabaseFake()) {
  mocks.createClient.mockResolvedValue(session.client);
  mocks.createAdminClient.mockReturnValue(admin.client);
  return { session, admin };
}
const asClient = () => mocks.getCurrentProfile.mockResolvedValue({ id: "prof-1", user_type: "client" });

beforeEach(() => vi.clearAllMocks());

describe("submitDocumentTransaction — refusals", () => {
  it("refuses anyone who is not a client", async () => {
    mocks.getCurrentProfile.mockResolvedValue(null);
    expect(await submitDocumentTransaction(tender)).toEqual({ ok: false, error: "Not authenticated." });
    mocks.getCurrentProfile.mockResolvedValue({ id: "s", user_type: "staff" });
    expect(await submitDocumentTransaction(tender)).toEqual({ ok: false, error: "Only clients can submit transactions." });
  });

  it("a sales order must name exactly one opportunity — and the refusal cleans up the uploads", async () => {
    asClient();
    const neither = await submitDocumentTransaction(salesOrder());
    expect(neither).toMatchObject({ ok: false, error: expect.stringMatching(/one existing opportunity or create one new/) });

    const both = await submitDocumentTransaction(salesOrder({
      opportunityId: UUID,
      newOpportunity: { opportunitySource: "referral", opportunityName: "X", forecastCategory: "open", revenue: 1 },
    }));
    expect(both).toMatchObject({ ok: false });
    expect(mocks.removeUploadedDocuments).toHaveBeenCalledTimes(2);
    expect(mocks.removeUploadedDocuments).toHaveBeenCalledWith(files);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("removes the uploads when the client or the service cannot be resolved", async () => {
    asClient();
    wire(makeSupabaseFake({ clients: [{ data: null }], services: [{ data: { id: "svc" } }] }));
    expect(await submitDocumentTransaction(tender)).toEqual({ ok: false, error: "No client account is linked to your profile." });

    wire(makeSupabaseFake({ clients: [{ data: { id: "cli-1" } }], services: [{ data: null }] }));
    expect(await submitDocumentTransaction(tender)).toEqual({ ok: false, error: "Tender submission is not configured yet." });
    expect(mocks.removeUploadedDocuments).toHaveBeenCalledTimes(2);
  });
});

describe("submitDocumentTransaction — idempotent retry", () => {
  it("returns the request already linked to the first uploaded object instead of raising a second one", async () => {
    asClient();
    const { session, admin } = wire(
      makeSupabaseFake({ clients: [{ data: { id: "cli-1" } }], services: [{ data: { id: "svc" } }] }),
      makeSupabaseFake({
        documents: [{ data: { id: "doc-existing" } }],
        request_documents: [{ data: { request_id: "req-prior", service_requests: { reference: "SR-0007" } } }],
      }),
    );

    const out = await submitDocumentTransaction(tender);

    expect(out).toEqual({ ok: true, reference: "SR-0007", requestId: "req-prior" });
    expect(admin.argsOf("documents", "eq")).toEqual([["client_id", "cli-1"], ["storage_path", "cli-1/a.pdf"]]);
    expect(session.from).not.toHaveBeenCalledWith("service_requests");
    expect(mocks.persistRequestDocuments).not.toHaveBeenCalled();
  });
});

describe("submitDocumentTransaction — a tender-family request", () => {
  // The admin fake queues one service_requests result too: the persist-failure
  // path awaits a delete and the route-failure path awaits an update, and an
  // awaited mutation consumes a queued result exactly as a read does.
  const happy = () => wire(
    makeSupabaseFake({
      clients: [{ data: { id: "cli-1" } }], services: [{ data: { id: "svc-t" } }],
      service_requests: [{ data: { id: "req-1", reference: "SR-0042" } }],
    }),
    makeSupabaseFake({ documents: [{ data: null }], service_requests: [{ data: null }] }),
  );

  it("creates the request, persists the documents, routes it, and returns the reference", async () => {
    asClient();
    const { session, admin } = happy();
    mocks.persistRequestDocuments.mockResolvedValue({ error: null });

    const out = await submitDocumentTransaction(tender);

    expect(out).toEqual({ ok: true, reference: "SR-0042", requestId: "req-1" });
    expect(session.argsOf("service_requests", "insert")[0][0]).toMatchObject({
      client_id: "cli-1", origin: "client", request_type: "tender_submission", service_id: "svc-t",
      title: "T-1 · Roads", reference: "",
    });
    expect(mocks.persistRequestDocuments).toHaveBeenCalledWith(expect.objectContaining({ clientId: "cli-1", profileId: "prof-1", requestId: "req-1", categoryId: null }));
    expect(admin.rpc).toHaveBeenCalledWith("route_request", { p_request_id: "req-1" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/transact");
  });

  it("deletes the request it just created when the documents cannot be persisted", async () => {
    asClient();
    const { admin } = happy();
    mocks.persistRequestDocuments.mockResolvedValue({ error: "object missing" });

    expect(await submitDocumentTransaction(tender)).toEqual({ ok: false, error: "object missing" });
    expect(admin.argsOf("service_requests", "delete")).toHaveLength(1);
    expect(admin.argsOf("service_requests", "eq")).toContainEqual(["id", "req-1"]);
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("falls back to awaiting_assignment when routing fails, rather than leaving the request stuck as new", async () => {
    asClient();
    const { admin } = happy();
    mocks.persistRequestDocuments.mockResolvedValue({ error: null });
    admin.rpc.mockResolvedValueOnce({ data: null, error: { message: "no partner" } });

    const out = await submitDocumentTransaction(tender);

    expect(out).toMatchObject({ ok: true, requestId: "req-1" });
    expect(admin.argsOf("service_requests", "update")[0][0]).toEqual({ status: "awaiting_assignment" });
    expect(admin.argsOf("service_requests", "eq")).toEqual(expect.arrayContaining([["id", "req-1"], ["status", "new"]]));
  });

  it("removes the uploads when the request insert itself fails", async () => {
    asClient();
    wire(
      makeSupabaseFake({ clients: [{ data: { id: "cli-1" } }], services: [{ data: { id: "svc-t" } }],
        service_requests: [{ data: null, error: { message: "quota" } }] }),
      makeSupabaseFake({ documents: [{ data: null }] }),
    );
    expect(await submitDocumentTransaction(tender)).toEqual({ ok: false, error: "quota" });
    expect(mocks.removeUploadedDocuments).toHaveBeenCalledWith(files);
  });
});

describe("submitDocumentTransaction — a sales order", () => {
  it("goes through the linked-sales-order function and returns what it created", async () => {
    asClient();
    const { session, admin } = wire(
      makeSupabaseFake({ clients: [{ data: { id: "cli-1" } }], services: [{ data: { id: "svc-so" } }], document_categories: [{ data: { id: "cat-po" } }] }),
      makeSupabaseFake({ documents: [{ data: null }] }),
    );
    mocks.verifyUploadedDocuments.mockResolvedValue({ documents: [{ locator: "cli-1/a.pdf" }], error: null });
    session.rpc.mockResolvedValueOnce({ data: [{ request_id: "req-so", request_reference: "SR-0100" }], error: null });

    const out = await submitDocumentTransaction(salesOrder({ opportunityId: UUID }));

    expect(out).toEqual({ ok: true, reference: "SR-0100", requestId: "req-so" });
    expect(session.rpc).toHaveBeenCalledWith("submit_linked_sales_order", expect.objectContaining({
      p_category_id: "cat-po", p_opportunity_id: UUID, p_new_opportunity: null, p_service_id: "svc-so", p_title: "Sales order SO-1",
    }));
    expect(admin.rpc).toHaveBeenCalledWith("route_request", { p_request_id: "req-so" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/sales/pipeline");
  });

  it("removes the uploads when the function refuses", async () => {
    asClient();
    const { session } = wire(
      makeSupabaseFake({ clients: [{ data: { id: "cli-1" } }], services: [{ data: { id: "svc-so" } }], document_categories: [{ data: null }] }),
      makeSupabaseFake({ documents: [{ data: null }] }),
    );
    mocks.verifyUploadedDocuments.mockResolvedValue({ documents: [], error: null });
    session.rpc.mockResolvedValueOnce({ data: null, error: { message: "opportunity closed" } });

    expect(await submitDocumentTransaction(salesOrder({ opportunityId: UUID }))).toEqual({ ok: false, error: "opportunity closed" });
    expect(mocks.removeUploadedDocuments).toHaveBeenCalledWith(files);
  });
});
