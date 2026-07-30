import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { documentStorage } from "@/lib/storage/documents";

// Secure document download. The user's session client selects the document, so
// RLS decides whether they may see it (client owns it, provider has it attached
// to their request, or staff). If visible, the admin client mints a short-lived
// signed URL to the private bucket and we redirect to it.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    return NextResponse.redirect(await documentStorage.createDownloadUrl(doc.storage_path, 60));
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
