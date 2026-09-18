import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginExperience } from "@/features/auth/LoginExperience";
import { loginRoleCopy, neutralLoginCopy } from "@/features/auth/loginRoles";

vi.mock("@/features/auth/actions", () => ({ signIn: vi.fn() }));

afterEach(cleanup);

describe("LoginExperience", () => {
  it("offers self-service account creation from the main and Client login pages", () => {
    const { rerender } = render(<LoginExperience copy={neutralLoginCopy} />);
    expect(screen.getByRole("link", { name: "Create a Client account" })).toHaveAttribute(
      "href",
      "/signup",
    );

    rerender(<LoginExperience copy={loginRoleCopy.client} activeRole="client" />);
    expect(screen.getByRole("link", { name: "Create a Client account" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("does not offer Client account creation from Provider or Staff login", () => {
    const { rerender } = render(
      <LoginExperience copy={loginRoleCopy.provider} activeRole="provider" />,
    );
    expect(screen.queryByRole("link", { name: "Create a Client account" })).toBeNull();

    rerender(<LoginExperience copy={loginRoleCopy.staff} activeRole="staff" />);
    expect(screen.queryByRole("link", { name: "Create a Client account" })).toBeNull();
  });

  it("confirms an account was created when automatic sign-in falls back to login", () => {
    render(<LoginExperience copy={neutralLoginCopy} accountCreated />);
    expect(screen.getByRole("status")).toHaveTextContent(/account is ready/i);
  });
});
