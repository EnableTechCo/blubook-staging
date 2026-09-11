import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
  getCurrentProfile: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/services/profiles", () => ({ getCurrentProfile: mocks.getCurrentProfile }));

import { rejectOffer } from "@/features/requests/actions";

const ASSIGNMENT = "11111111-1111-4111-8111-111111111111";
const REQUEST = "22222222-2222-4222-8222-222222222222";

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("rejectOffer", () => {
  const rpc = vi.fn().mockResolvedValue({ data: null, error: null });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue({ rpc });
  });

  it("records the decline with its reason and re-routes", async () => {
    await rejectOffer(form({ assignmentId: ASSIGNMENT, requestId: REQUEST, reason: "  No capacity until October. " }));

    expect(rpc).toHaveBeenCalledWith("reject_assignment", {
      p_assignment_id: ASSIGNMENT,
      p_note: "No capacity until October.",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/dashboard/reports/requests/${REQUEST}`);
  });

  it("does nothing without a reason — a post without one is not a decline", async () => {
    await rejectOffer(form({ assignmentId: ASSIGNMENT, reason: "" }));
    await rejectOffer(form({ assignmentId: ASSIGNMENT, reason: "no" }));
    await rejectOffer(form({ assignmentId: ASSIGNMENT }));

    expect(rpc).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("does nothing for an assignment id that is not one", async () => {
    await rejectOffer(form({ assignmentId: "offer-1", reason: "Outside our sector." }));
    expect(rpc).not.toHaveBeenCalled();
  });
});
