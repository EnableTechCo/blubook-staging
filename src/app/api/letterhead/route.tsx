import { NextResponse } from "next/server";
import { LetterheadDocument } from "@/features/letterhead/Letterhead";
import { getLetterheadState } from "@/features/letterhead/queries";
import { renderPdf } from "@/features/pdf/render";
import { getCurrentProfile } from "@/services/profiles";

/**
 * The client's own letterhead, blank.
 *
 * Client-only, and not because of a policy on this route: the letterhead is
 * assembled under the caller's session, and the banking details it shows admit
 * no reader but the client. A staff member reaching this URL would render a
 * letterhead with no bank account on it — but there is no reason for them to
 * be here, so it is refused outright.
 */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (profile.user_type !== "client") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data } = await getLetterheadState();
  if (!data) return NextResponse.json({ error: "No client account" }, { status: 404 });

  const pdf = await renderPdf(<LetterheadDocument data={data} />);
  const filename = `${data.tradingName.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}-letterhead.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
