import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "@/app/page";

afterEach(cleanup);

describe("HomePage", () => {
  it("offers supported consultation and sign-in paths without promoting signup", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /business, with fewer loose ends/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /sign in/i })[0]).toHaveAttribute(
      "href",
      "/login",
    );
    for (const link of screen.getAllByRole("link", {
      name: /talk to us|operations specialist|discuss your needs|start the conversation/i,
    })) {
      expect(link).toHaveAttribute("href", "#contact");
    }
    for (const link of screen.getAllByRole("link", {
      name: /example consultation line/i,
    })) {
      expect(link).toHaveAttribute("href", "tel:+27105550142");
    }
    expect(screen.queryByRole("link", { name: /create account/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/trust score/i)).not.toBeInTheDocument();
    expect(screen.getByText("Available capability is reviewed.")).toBeInTheDocument();
    expect(screen.getByText("The Client workspace opens.")).toBeInTheDocument();
  });

  it("opens and closes the mobile navigation after choosing an anchor", () => {
    render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("navigation", { name: "Mobile navigation" }).querySelector(
        'a[href="#what-we-do"]',
      )!,
    );
    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" }),
    ).not.toBeInTheDocument();

    const openButton = screen.getByRole("button", { name: "Open navigation menu" });
    fireEvent.click(openButton);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open navigation menu" })).toHaveFocus();
  });
});
