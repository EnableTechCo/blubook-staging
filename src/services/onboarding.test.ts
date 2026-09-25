import { beforeEach, describe, expect, it, vi } from "vitest";
import { onboardingMatchesStage } from "@/services/onboardingFilters";
import type { Enums } from "@/types/database";
import { makeSupabaseFake, mockCreateClient } from "../../tests/stubs/supabaseFake";

// ---------------------------------------------------------------------------
// The stage filter. These four moved here from dashboard.onboarding.test.ts,
// which tested onboardingFilters and nothing in dashboard.ts — the name was
// wrong. They live beside the queue that applies them.
// ---------------------------------------------------------------------------

function onboarding(
  status: Enums<"onboarding_status">,
  documentStatuses: Enums<"compliance_status">[],
) {
  return {
    status,
    onboarding_documents: documentStatuses.map((documentStatus) => ({ status: documentStatus })),
  };
}

describe("onboarding queue filters", () => {
  const mixed = onboarding("awaiting_documents", ["outstanding", "received", "verified"]);

  it("keeps a partially submitted onboarding in the broad awaiting-documents view", () => {
    expect(onboardingMatchesStage(mixed, "awaiting_documents")).toBe(true);
  });

  it("includes the same onboarding in the awaiting-review document view", () => {
    expect(onboardingMatchesStage(mixed, "awaiting_review")).toBe(true);
    expect(onboardingMatchesStage(mixed, "rejected")).toBe(false);
  });

  it("uses the stored onboarding state for completion", () => {
    expect(onboardingMatchesStage(onboarding("completed", ["verified", "verified"]), "complete")).toBe(true);
    expect(onboardingMatchesStage(mixed, "complete")).toBe(false);
  });

  it("puts a submitted, unapproved case in the approval view and nowhere else but all", () => {
    const submitted = { ...onboarding("in_progress", []), submitted_at: "2026-09-25T08:00:00Z", approved_at: null };
    expect(onboardingMatchesStage(submitted, "awaiting_approval")).toBe(true);
    expect(onboardingMatchesStage(submitted, "awaiting_documents")).toBe(false);
    expect(onboardingMatchesStage(submitted, "complete")).toBe(false);
    expect(onboardingMatchesStage(mixed, "awaiting_approval")).toBe(false);
  });

  it("includes rejected replacements in the rejected view", () => {
    const replacement = onboarding("awaiting_documents", ["rejected", "outstanding"]);
    expect(onboardingMatchesStage(replacement, "rejected")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The staff queue itself
// ---------------------------------------------------------------------------

const queued = (id: string, status: Enums<"onboarding_status">, docs: Enums<"compliance_status">[]) => ({
  id, status, created_at: "2026-09-01", clients: null,
  onboarding_documents: docs.map((s) => ({ id: `${id}-${s}`, status: s, notes: null,
    document_type_id: null, compliance_document_types: null, documents: [] })),
});

describe("getStaffOnboardings", () => {
  beforeEach(() => vi.resetModules());

  it("returns the queue unfiltered when there is no search term", async () => {
    const rows = [queued("o1", "awaiting_documents", ["outstanding"])];
    const fake = makeSupabaseFake({ onboardings: [{ data: rows }] });
    mockCreateClient(fake);
    const { getStaffOnboardings } = await import("@/services/onboarding");

    expect(await getStaffOnboardings()).toEqual(rows);
    expect(fake.from).not.toHaveBeenCalledWith("clients");
    expect(fake.argsOf("onboardings", "in")).toEqual([]);
  });

  it("searches by business name AND customer id, then narrows the queue to those clients", async () => {
    const fake = makeSupabaseFake({
      clients: [{ data: [{ id: "c1" }] }, { data: [{ id: "c1" }, { id: "c2" }] }],
      onboardings: [{ data: [] }],
    });
    mockCreateClient(fake);
    const { getStaffOnboardings } = await import("@/services/onboarding");

    await getStaffOnboardings("river");
    expect(fake.argsOf("clients", "ilike")).toEqual([
      ["business_name", "%river%"],
      ["external_reference", "%river%"],
    ]);
    // de-duplicated across the two lookups
    expect(fake.argsOf("onboardings", "in")).toEqual([["client_id", ["c1", "c2"]]]);
  });

  it("returns empty without touching onboardings when no client matches", async () => {
    const fake = makeSupabaseFake({ clients: [{ data: [] }, { data: [] }] });
    mockCreateClient(fake);
    const { getStaffOnboardings } = await import("@/services/onboarding");

    expect(await getStaffOnboardings("nobody")).toEqual([]);
    expect(fake.from).not.toHaveBeenCalledWith("onboardings");
  });

  it("applies the stage filter after the query", async () => {
    const fake = makeSupabaseFake({ onboardings: [{ data: [
      queued("done", "completed", ["verified"]),
      queued("open", "awaiting_documents", ["outstanding"]),
    ] }] });
    mockCreateClient(fake);
    const { getStaffOnboardings } = await import("@/services/onboarding");

    expect((await getStaffOnboardings("", "complete")).map((o) => o.id)).toEqual(["done"]);
  });
});

describe("getComplianceChecklistForRequest", () => {
  beforeEach(() => vi.resetModules());

  it("looks the onboarding up by its compliance request, null when absent", async () => {
    const fake = makeSupabaseFake({ onboardings: [{ data: null }] });
    mockCreateClient(fake);
    const { getComplianceChecklistForRequest } = await import("@/services/onboarding");

    expect(await getComplianceChecklistForRequest("req-7")).toBeNull();
    expect(fake.argsOf("onboardings", "eq")).toEqual([["compliance_request_id", "req-7"]]);
  });
});
