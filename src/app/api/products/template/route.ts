import { NextResponse } from "next/server";
import { buildProductTemplate } from "@/features/products/productWorkbook";

// The blank product list. Built rather than served from disk so the headings
// can only ever be the ones the parser accepts — a checked-in file would drift
// from the parser the first time a column changed.
//
// Public on purpose: it is an empty workbook of column headings, and an
// invited client downloads it from the onboarding wizard before they have a
// login.
export async function GET() {
  const workbook = await buildProductTemplate();

  return new NextResponse(new Uint8Array(workbook), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="blubook-product-list-template.xlsx"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
