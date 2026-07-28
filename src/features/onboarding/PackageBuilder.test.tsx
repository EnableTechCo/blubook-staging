import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PackageBuilder } from "./PackageBuilder";

const packages = [
  {
    id: "package-1",
    name: "Foundation",
    tier: "basic",
    price: 1000,
    items: [{ id: "item-1", name: "Registration", tier: "basic", price: 700 }],
  },
];

const lineItems = [
  {
    id: "item-2",
    name: "Tax clearance",
    tier: "professional",
    price: 500,
    serviceName: "Compliance",
  },
];

afterEach(cleanup);

describe("PackageBuilder", () => {
  it("preserves standard package payloads until an extra is added", () => {
    const { container } = render(
      <PackageBuilder packages={packages} lineItems={lineItems} />,
    );

    expect(container.querySelector<HTMLInputElement>('input[name="packageMode"]')?.value).toBe(
      "standard",
    );
    expect(container.querySelector<HTMLInputElement>('input[name="packageId"]')?.value).toBe(
      "package-1",
    );
    expect(container.querySelector<HTMLInputElement>('input[name="lineItemIds"]')?.value).toBe(
      '["item-1"]',
    );

    fireEvent.change(screen.getByLabelText("Add a line item"), {
      target: { value: "item-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));

    expect(container.querySelector<HTMLInputElement>('input[name="packageMode"]')?.value).toBe(
      "flex",
    );
    expect(container.querySelector<HTMLInputElement>('input[name="lineItemIds"]')?.value).toBe(
      '["item-1","item-2"]',
    );
    expect(screen.getByText("Tax clearance")).toBeInTheDocument();
  });

  it("removes an added line item and restores standard pricing mode", () => {
    const { container } = render(
      <PackageBuilder packages={packages} lineItems={lineItems} />,
    );

    fireEvent.change(screen.getByLabelText("Add a line item"), {
      target: { value: "item-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Tax clearance" }));

    expect(container.querySelector<HTMLInputElement>('input[name="packageMode"]')?.value).toBe(
      "standard",
    );
    expect(container.querySelector<HTMLInputElement>('input[name="lineItemIds"]')?.value).toBe(
      '["item-1"]',
    );
  });
});
