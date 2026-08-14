import { NextResponse } from "next/server";
import { buildProductTemplate } from "@/features/products/productWorkbook";
import { getCurrentProfile } from "@/services/profiles";

// The blank product list. Built rather than served from disk so the headings
// can only ever be the ones the parser accepts — a checked-in file would drift
// from the parser the first time a column changed.
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const workbook = await buildProductTemplate();

  return new NextResponse(new Uint8Array(workbook), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="blubook-product-list-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
