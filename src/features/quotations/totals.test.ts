import { describe, expect, it } from "vitest";
import { lineTotals, quotationTotals, round2 } from "@/features/quotations/totals";

describe("a quoted line", () => {
  it("multiplies quantity by price", () => {
    expect(lineTotals({ quantity: 3, unit_price: 100, vat_rate: 15 })).toEqual({
      lineTotal: 300,
      vat: 45,
    });
  });

  // Rounded per line, because that is the number printed on the line. A client
  // checking 3 × R33,33 with a calculator must get what the page says.
  it("rounds the line, not just the total", () => {
    expect(lineTotals({ quantity: 3, unit_price: 33.33, vat_rate: 0 }).lineTotal).toBe(99.99);
  });

  it("handles a fractional quantity", () => {
    expect(lineTotals({ quantity: 2.5, unit_price: 40, vat_rate: 15 })).toEqual({
      lineTotal: 100,
      vat: 15,
    });
  });

  it("charges nothing on a zero-rated line", () => {
    expect(lineTotals({ quantity: 10, unit_price: 50, vat_rate: 0 }).vat).toBe(0);
  });
});

describe("a quotation total", () => {
  it("adds the lines up", () => {
    expect(quotationTotals([
      { quantity: 2, unit_price: 100, vat_rate: 15 },
      { quantity: 1, unit_price: 50, vat_rate: 15 },
    ])).toEqual({ subtotal: 250, vatTotal: 37.5, total: 287.5 });
  });

  // Mixed rates are ordinary — zero-rated goods beside standard-rated ones —
  // and one rate applied to the subtotal would overcharge.
  it("applies each line's own VAT rate", () => {
    expect(quotationTotals([
      { quantity: 1, unit_price: 100, vat_rate: 15 },
      { quantity: 1, unit_price: 100, vat_rate: 0 },
    ])).toEqual({ subtotal: 200, vatTotal: 15, total: 215 });
  });

  it("is zero for nothing", () => {
    expect(quotationTotals([])).toEqual({ subtotal: 0, vatTotal: 0, total: 0 });
  });

  // Floating point would otherwise show 0.30000000000000004 to a customer.
  it("does not leak binary floating point into a price", () => {
    expect(quotationTotals([
      { quantity: 1, unit_price: 0.1, vat_rate: 0 },
      { quantity: 1, unit_price: 0.2, vat_rate: 0 },
    ]).total).toBe(0.3);
  });

  it("rounds half a cent up rather than losing it", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
  });
});
