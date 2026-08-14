import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { documentStorage } from "@/lib/storage/documents";
import { getCurrentProfile } from "@/services/profiles";

// Secure document download. Session-scoped identity lookups establish the
// caller; explicit ownership/request-link checks decide access before the admin
// client mints a short-lived URL to the private bucket.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("documents")
    .select("client_id,storage_path,category")
    .eq("id", id)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Staff read the archive, with one exception. A quotation is printed on the
  // client's letterhead, which carries a bank account no staff member may read
  // in the table it lives in — so it must not be downloadable from here either.
  // The RLS policy says the same thing, but this route reads through the admin
  // client, which bypasses it: the rule has to be stated in both places or it
  // is stated in neither.
  const clientOnly = doc.category === "quotation";
  let mayDownload = profile.user_type === "staff" && !clientOnly;
  if (profile.user_type === "client") {
    const { data: client } = await supabase.from("clients").select("id").maybeSingle();
    mayDownload = client?.id === doc.client_id;
  }
  if (!mayDownload && profile.user_type !== "staff" && !clientOnly) {
    const { data: visibleRequests } = await supabase
      .from("service_requests")
      .select("id")
      .returns<{ id: string }[]>();
    const requestIds = (visibleRequests ?? []).map((request) => request.id);
    if (requestIds.length > 0) {
      const { data: visibleLink } = await admin
        .from("request_documents")
        .select("document_id")
        .eq("document_id", id)
        .in("request_id", requestIds)
        .limit(1)
        .maybeSingle();
      mayDownload = Boolean(visibleLink);
    }
  }
  if (!mayDownload) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    return NextResponse.redirect(await documentStorage.createDownloadUrl(doc.storage_path, 60));
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
