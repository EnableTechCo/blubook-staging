import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LandingComparison } from "@/components/public/LandingComparison";

afterEach(cleanup);

describe("LandingComparison", () => {
  it("switches between the before and BluBook views", () => {
    render(<LandingComparison />);

    expect(screen.getByRole("button", { name: "With BluBook" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("One visible service record")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Before" }));

    expect(screen.getByRole("button", { name: "Before" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Separate inbox threads")).toBeInTheDocument();
    expect(screen.queryByText("One visible service record")).not.toBeInTheDocument();
  });
});
