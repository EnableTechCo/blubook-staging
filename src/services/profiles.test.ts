import { beforeEach, describe, expect, it, vi } from "vitest";

const getClaims = vi.fn();
const single = vi.fn();
const eq = vi.fn(() => ({ single }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getClaims }, from })),
}));

import { getCurrentProfile } from "@/services/profiles";

// The token is verified with getClaims(), which checks the signature locally
// against the project's published keys; the user id is its `sub` claim.
const signedIn = (sub: string) => ({ data: { claims: { sub } }, error: null });
const signedOut = () => ({ data: null, error: null });

describe("getCurrentProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when there is no authenticated user", async () => {
    getClaims.mockResolvedValue(signedOut());
    expect(await getCurrentProfile()).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("returns the profile row scoped to the authenticated user", async () => {
    getClaims.mockResolvedValue(signedIn("user-1"));
    single.mockResolvedValue({
      data: { id: "user-1", user_type: "client", status: "active" },
      error: null,
    });

    const profile = await getCurrentProfile();

    expect(from).toHaveBeenCalledWith("profiles");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
    expect(profile).toMatchObject({ id: "user-1", user_type: "client" });
  });

  it("returns null when the profile query errors", async () => {
    getClaims.mockResolvedValue(signedIn("user-1"));
    single.mockResolvedValue({ data: null, error: { message: "not found" } });
    expect(await getCurrentProfile()).toBeNull();
  });
});
