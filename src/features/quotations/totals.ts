/**
 * What a quotation comes to.
 *
 * Kept pure and separate because it is the part a client will check with a
 * calculator. Rounding is applied per line and then summed, which is how an
 * invoice is read: a line that says 3 × R33,33 has to say R99,99, not R100,00
 * because the total was rounded once at the end.
 *
 * VAT is per line rather than per quotation. Products can carry different
 * rates — zero-rated goods beside standard-rated ones is ordinary — and a
 * single rate applied to the subtotal would quietly overcharge.
 */
export interface QuotableLine {
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

export interface LineTotals {
  lineTotal: number;
  vat: number;
}

export interface QuotationTotals {
  subtotal: number;
  vatTotal: number;
  total: number;
}

/** Two decimals, away from zero, so a half cent never disappears. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineTotals(line: QuotableLine): LineTotals {
  const lineTotal = round2(line.quantity * line.unit_price);
  return { lineTotal, vat: round2(lineTotal * (line.vat_rate / 100)) };
}

export function quotationTotals(lines: QuotableLine[]): QuotationTotals {
  let subtotal = 0;
  let vatTotal = 0;

  for (const line of lines) {
    const totals = lineTotals(line);
    subtotal = round2(subtotal + totals.lineTotal);
    vatTotal = round2(vatTotal + totals.vat);
  }

  return { subtotal, vatTotal, total: round2(subtotal + vatTotal) };
}
