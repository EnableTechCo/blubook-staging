import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductListWorkspace } from "@/features/products/ProductListWorkspace";
import type { ClientProduct } from "@/features/products/queries";

vi.mock("@/features/products/actions", () => ({
  deleteProduct: vi.fn(),
  saveProduct: vi.fn(),
  setProductActive: vi.fn(),
  uploadProductList: vi.fn(),
}));

const product = (over: Partial<ClientProduct> = {}): ClientProduct => ({
  id: "3f1a6d2e-1c4b-4a9e-9c3d-0b7a5e2f8c41",
  product_code: "RC-COF-001",
  description: "Ethiopian beans",
  unit: "kg",
  unit_price: 185,
  vat_rate: 15,
  category: "Coffee",
  active: true,
  updated_at: "2026-09-01T00:00:00Z",
  ...over,
});

afterEach(cleanup);

describe("ProductListWorkspace", () => {
  it("shows the empty state when there is nothing to quote from", () => {
    render(<ProductListWorkspace products={[]} />);
    expect(screen.getByText("No products yet")).toBeInTheDocument();
    // The count line specifically — a looser pattern also matched "Add product".
    expect(screen.queryByText(/\d+ products? · /)).not.toBeInTheDocument();
  });

  it("renders each product's code, description and en-ZA price", () => {
    render(<ProductListWorkspace products={[product()]} />);
    expect(screen.getByText("RC-COF-001")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ethiopian beans" })).toBeInTheDocument();
    // money() formats in en-ZA: "R 185,00" with a non-breaking space and comma decimal
    expect(screen.getByText(/R\s?185,00/)).toBeInTheDocument();
  });

  it("summarises the list as all quotable when nothing is withdrawn", () => {
    render(<ProductListWorkspace products={[product(), product({ id: "b", product_code: "RC-COF-002" })]} />);
    expect(screen.getByText(/2 products · all available to quote/)).toBeInTheDocument();
  });

  it("counts withdrawn products and labels them, offering to return them", () => {
    render(<ProductListWorkspace products={[product(), product({ id: "b", product_code: "RC-EQP-005", active: false })]} />);
    expect(screen.getByText(/2 products · 1 withdrawn/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Return to quotations" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Withdraw from quotations" })).toBeInTheDocument();
  });

  it("singularises a list of one", () => {
    render(<ProductListWorkspace products={[product()]} />);
    expect(screen.getByText(/^1 product · all available to quote$/)).toBeInTheDocument();
  });
});
