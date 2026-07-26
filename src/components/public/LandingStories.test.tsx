import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LandingStories } from "@/components/public/LandingStories";

afterEach(cleanup);

describe("LandingStories", () => {
  it("supports roving keyboard selection across story tabs", () => {
    render(<LandingStories />);

    const first = screen.getByRole("tab", {
      name: "The paperwork moves. You keep leading.",
    });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });

    const second = screen.getByRole("tab", {
      name: "The right capability, with the context intact.",
    });
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("tabpanel", {
        name: "The right capability, with the context intact.",
      }),
    ).toHaveTextContent("existing provider workflow");

    fireEvent.keyDown(second, { key: "End" });
    expect(
      screen.getByRole("tab", { name: "Progress stays attached to the work." }),
    ).toHaveAttribute("aria-selected", "true");
  });
});
