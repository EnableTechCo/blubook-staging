import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusLabel } from "@/components/ui/StatusLabel";

describe("StatusLabel", () => {
  it("renders a readable operational status", () => {
    render(<StatusLabel status="awaiting_assignment" />);

    expect(screen.getByText("Awaiting Assignment")).toBeInTheDocument();
  });

  it("falls back safely for an unmapped status", () => {
    render(<StatusLabel status="future_state" />);

    expect(screen.getByText("Future State")).toHaveClass("text-ink/75");
  });
});
