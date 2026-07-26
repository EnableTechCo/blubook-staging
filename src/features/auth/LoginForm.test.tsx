import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/auth/LoginForm";

vi.mock("@/features/auth/actions", () => ({
  signIn: vi.fn(),
}));

describe("LoginForm", () => {
  afterEach(cleanup);

  it("preserves password-manager semantics and toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginForm submitLabel="Sign in as a Client" />);

    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(email).toHaveAttribute("autocomplete", "email");
    expect(password).toHaveAttribute("name", "password");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(password).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: "Sign in as a Client" })).toBeEnabled();

    await user.type(password, "secure-password");
    await user.click(toggle);

    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue("secure-password");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("does not offer unsupported login controls or promote signup", () => {
    render(<LoginForm />);

    expect(screen.queryByText(/create one|create account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/remember me|forgot password|single sign-on/i)).not.toBeInTheDocument();
    expect(screen.getByText(/workspace assigned to your account/i)).toBeVisible();
  });
});
