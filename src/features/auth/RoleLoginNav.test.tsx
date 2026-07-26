import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoleLoginNav } from "@/features/auth/RoleLoginNav";
import { loginRoleCopy } from "@/features/auth/loginRoles";

describe("RoleLoginNav", () => {
  it("links to each presentational role route and marks the active page", () => {
    render(<RoleLoginNav activeRole="provider" />);

    expect(screen.getByRole("link", { name: "Client" })).toHaveAttribute(
      "href",
      "/login/client",
    );
    expect(screen.getByRole("link", { name: "Provider" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Staff" })).toHaveAttribute(
      "href",
      "/login/staff",
    );
  });

  it("keeps role copy grounded in supported workspace behavior", () => {
    expect(loginRoleCopy.client.introduction).toMatch(/service requests/i);
    expect(loginRoleCopy.provider.introduction).toMatch(/routed offers/i);
    expect(loginRoleCopy.staff.introduction).toMatch(/Client onboarding/i);
  });
});
