import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ClientArtwork } from "@/features/dashboard/ClientArtwork";

afterEach(cleanup);

describe("ClientArtwork", () => {
  it("renders the artwork from the public bucket", () => {
    render(<ClientArtwork businessName="Maboneng Trading" artworkPath="client-1/logo.png" />);
    const image = screen.getByRole("img", { name: "Maboneng Trading artwork" });
    expect(image.getAttribute("src")).toContain("/storage/v1/object/public/artwork/client-1/logo.png");
  });

  // The header keeps its shape for an account that has not supplied artwork.
  it("falls back to initials when there is no artwork", () => {
    render(<ClientArtwork businessName="Maboneng Trading" artworkPath={null} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("MT")).toBeInTheDocument();
  });

  it("takes at most two initials", () => {
    render(<ClientArtwork businessName="Blue Harbor Books Limited" artworkPath={null} />);
    expect(screen.getByText("BH")).toBeInTheDocument();
  });
});
