import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_UNAVAILABLE,
  SIGN_IN_ERROR,
  SIGN_IN_UNAVAILABLE,
  SIGN_UP_ERROR,
} from "@/features/auth/authMessages";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { signIn, signUp } from "@/features/auth/actions";

function credentials() {
  const formData = new FormData();
  formData.set("email", "person@example.com");
  formData.set("password", "password123");
  return formData;
}

function profileResult(status: "active" | "suspended" = "active") {
  const single = vi.fn().mockResolvedValue({ data: { status }, error: null });
  const eq = vi.fn(() => ({ single }));
  return {
    select: vi.fn(() => ({
      eq,
    })),
    eq,
  };
}

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates credentials before calling Supabase", async () => {
    const formData = credentials();
    formData.set("email", "not-an-email");

    const result = await signIn(undefined, formData);

    expect(result?.error).toMatch(/valid email/i);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("maps credential failures without leaking the Supabase message", async () => {
    const signInWithPassword = vi
      .fn()
      .mockResolvedValue({ error: new Error("User does not exist in auth.users") });
    mocks.createClient.mockResolvedValue({
      auth: { signInWithPassword },
    });

    const result = await signIn(undefined, credentials());

    expect(result).toEqual({ error: SIGN_IN_ERROR });
    expect(result?.error).not.toContain("auth.users");
  });

  it("maps network failures to a controlled message", async () => {
    mocks.createClient.mockRejectedValue(new Error("secret upstream detail"));

    await expect(signIn(undefined, credentials())).resolves.toEqual({
      error: SIGN_IN_UNAVAILABLE,
    });
  });

  it("signs out a suspended profile instead of opening a workspace", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const profile = profileResult("suspended");
    mocks.createClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
        signOut,
      },
      from: vi.fn(() => profile),
    });

    const result = await signIn(undefined, credentials());

    expect(result).toEqual({ error: ACCOUNT_UNAVAILABLE });
    expect(profile.eq).toHaveBeenCalledWith("id", "user-123");
    expect(signOut).toHaveBeenCalledOnce();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects an active authenticated profile to the authoritative dashboard", async () => {
    const profile = profileResult("active");
    mocks.createClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
        signOut: vi.fn(),
      },
      from: vi.fn(() => profile),
    });

    await expect(signIn(undefined, credentials())).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(profile.eq).toHaveBeenCalledWith("id", "user-123");
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("sanitizes signup errors", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          error: new Error("Database trigger failed with internal relation name"),
        }),
      },
    });
    const formData = credentials();
    formData.set("fullName", "Example Client");

    const result = await signUp(undefined, formData);

    expect(result).toEqual({ error: SIGN_UP_ERROR });
    expect(result?.error).not.toContain("relation");
  });
});
