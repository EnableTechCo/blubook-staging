import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock is hoisted above every top-level statement, and clientAccess.ts
// imports profiles at module evaluation — so a plain `const` mock is read
// before it is initialised. vi.hoisted lifts the declarations with it.
const { getCurrentProfile, maybeSingle, eq, select, from } = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { getCurrentProfile: vi.fn(), maybeSingle, eq, select, from };
});

vi.mock("@/services/profiles", () => ({ getCurrentProfile }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

import { currentClient, requireClient, requireProvider } from "@/services/clientAccess";

// These replaced eighteen inline role checks and two private copies of the
// client lookup. What matters is that the one answer is the right answer for
// every caller that used to have its own — including the copy that filtered
// by profile and the copy that did not.

describe("requireClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses when nobody is signed in", async () => {
    getCurrentProfile.mockResolvedValue(null);
    expect(await requireClient()).toBe("Not authenticated.");
  });

  it("lets a client through", async () => {
    getCurrentProfile.mockResolvedValue({ id: "p1", user_type: "client" });
    expect(await requireClient()).toBeNull();
  });

  it.each(["staff", "service_provider"])("refuses a %s", async (user_type) => {
    getCurrentProfile.mockResolvedValue({ id: "p1", user_type });
    expect(await requireClient()).toBe("Only a client can do this.");
  });
});

describe("requireProvider", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lets a service partner through", async () => {
    getCurrentProfile.mockResolvedValue({ id: "p1", user_type: "service_provider" });
    expect(await requireProvider()).toBeNull();
  });

  it.each(["client", "staff"])("refuses a %s", async (user_type) => {
    getCurrentProfile.mockResolvedValue({ id: "p1", user_type });
    expect(await requireProvider()).toBe("Only a service partner can do this.");
  });
});

describe("currentClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves the client record filtered by the signed-in profile", async () => {
    getCurrentProfile.mockResolvedValue({ id: "profile-9", user_type: "client" });
    maybeSingle.mockResolvedValue({ data: { id: "client-42" }, error: null });

    expect(await currentClient()).toEqual({ id: "client-42" });

    // The filter is the point of consolidating: one of the two former copies
    // relied on RLS to narrow this to a single row. Now it is explicit.
    expect(from).toHaveBeenCalledWith("clients");
    expect(eq).toHaveBeenCalledWith("primary_profile_id", "profile-9");
  });

  it("does not touch the database for a non-client", async () => {
    getCurrentProfile.mockResolvedValue({ id: "p1", user_type: "staff" });
    expect(await currentClient()).toBe("Only a client can do this.");
    expect(from).not.toHaveBeenCalled();
  });

  it("explains a client profile with no client record", async () => {
    getCurrentProfile.mockResolvedValue({ id: "p1", user_type: "client" });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await currentClient()).toBe("No client record is linked to this account.");
  });
});
