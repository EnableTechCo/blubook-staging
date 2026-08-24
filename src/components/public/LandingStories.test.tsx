import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LandingStories } from "@/components/public/LandingStories";

afterEach(cleanup);

describe("LandingStories", () => {
  it("presents all three operating stories as editorial articles", () => {
    render(<LandingStories />);

    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(
      screen.getByRole("heading", { name: "The paperwork moves. You keep leading." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "The right capability, with the context intact." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Progress stays attached to the work." }),
    ).toBeInTheDocument();
    expect(screen.getByText("One brief follows the service request")).toBeInTheDocument();
  });
});
