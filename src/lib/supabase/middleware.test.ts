import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));
vi.mock("@/lib/env/server", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-key",
  },
}));

import { updateSession } from "@/lib/supabase/middleware";

function supabaseSession({
  userId,
  status = "active",
}: {
  userId?: string;
  status?: "active" | "suspended";
}) {
  const signOut = vi.fn().mockResolvedValue({ error: null });
  const single = vi.fn().mockResolvedValue({
    data: userId ? { status } : null,
    error: userId ? null : new Error("missing profile"),
  });
  const eq = vi.fn(() => ({ single }));

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: userId ? { id: userId } : null },
        }),
        signOut,
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({ eq })),
      })),
    },
    eq,
    signOut,
  };
}

describe("updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs out an existing suspended session and redirects protected access", async () => {
    const session = supabaseSession({ userId: "staff-123", status: "suspended" });
    mocks.createServerClient.mockReturnValue(session.client);

    const response = await updateSession(
      new NextRequest("http://localhost:3000/dashboard"),
    );

    expect(session.eq).toHaveBeenCalledWith("id", "staff-123");
    expect(session.signOut).toHaveBeenCalledOnce();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirectedFrom=%2Fdashboard",
    );
  });

  it("redirects an active authenticated session away from nested login routes", async () => {
    const session = supabaseSession({ userId: "client-123", status: "active" });
    mocks.createServerClient.mockReturnValue(session.client);

    const response = await updateSession(
      new NextRequest("http://localhost:3000/login/client"),
    );

    expect(session.eq).toHaveBeenCalledWith("id", "client-123");
    expect(session.signOut).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard",
    );
  });

  it("allows an unauthenticated visitor to use a role login route", async () => {
    const session = supabaseSession({});
    mocks.createServerClient.mockReturnValue(session.client);

    const response = await updateSession(
      new NextRequest("http://localhost:3000/login/provider"),
    );

    expect(response.status).toBe(200);
    expect(session.signOut).not.toHaveBeenCalled();
  });
});
