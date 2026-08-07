import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout/AppShell";
import type { Profile } from "@/services/profiles";

vi.mock("@/features/auth/actions", () => ({
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

afterEach(cleanup);

function profile(userType: Profile["user_type"]): Profile {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    created_at: "2026-07-26T00:00:00.000Z",
    updated_at: "2026-07-26T00:00:00.000Z",
    email: "operator@example.com",
    full_name: "Test Operator",
    staff_role: userType === "staff" ? "operations" : null,
    status: "active",
    user_type: userType,
  };
}

describe("AppShell", () => {
  it("shows only supported Client navigation", () => {
    render(
      <AppShell profile={profile("client")}>
        <p>Client content</p>
      </AppShell>,
    );

    expect(screen.getByText("Client content")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Dashboard" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    // Messaging (system #9) is now supported, so it appears in the client nav
    // (rendered in both the desktop sidebar and the mobile menu).
    expect(screen.getAllByRole("link", { name: "Messages" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Document Archive" })).toHaveLength(2);
    expect(screen.getAllByText("Transact")).toHaveLength(2);
    expect(screen.getAllByText("Sales")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Pipeline" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Bookings" })).toHaveLength(2);
    // Reporting lives in its own tab rather than under Transact.
    expect(screen.getAllByRole("link", { name: "Reports" })).toHaveLength(2);
  });

  it("gives partners the Reports tab too", () => {
    render(
      <AppShell profile={profile("service_provider")}>
        <p>Provider content</p>
      </AppShell>,
    );

    expect(screen.getAllByRole("link", { name: "Reports" })).toHaveLength(2);
    expect(screen.queryByText("Sales")).not.toBeInTheDocument();
  });

  it("includes existing Staff onboarding destinations", () => {
    render(
      <AppShell profile={profile("staff")}>
        <p>Staff content</p>
      </AppShell>,
    );

    expect(screen.getAllByRole("link", { name: "Onboardings" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Onboard a client" })).toHaveLength(
      2,
    );
    // Transacting is client-initiated; Staff have no entry point.
    expect(screen.queryByText("Transact")).not.toBeInTheDocument();
    // Reporting is scoped to a client's or partner's own work.
    expect(screen.queryByText("Reports")).not.toBeInTheDocument();
    expect(screen.queryByText("Sales")).not.toBeInTheDocument();
  });
});
