import { describe, expect, it } from "vitest";
import { isAuthRoute, isProtectedRoute } from "@/lib/auth/routeAccess";

describe("route access helpers", () => {
  it.each(["/login", "/login/client", "/login/provider", "/login/staff", "/signup"])(
    "recognizes %s as an auth route",
    (pathname) => {
      expect(isAuthRoute(pathname)).toBe(true);
    },
  );

  it("does not overmatch unrelated login-prefixed paths", () => {
    expect(isAuthRoute("/login-anything")).toBe(false);
    expect(isAuthRoute("/")).toBe(false);
  });

  it("recognizes dashboard descendants as protected", () => {
    expect(isProtectedRoute("/dashboard")).toBe(true);
    expect(isProtectedRoute("/dashboard/requests/123")).toBe(true);
    expect(isProtectedRoute("/login")).toBe(false);
    expect(isProtectedRoute("/dashboarding")).toBe(false);
    expect(isProtectedRoute("/dashboard-public")).toBe(false);
  });
});
