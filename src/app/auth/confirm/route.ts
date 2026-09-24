import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const supabase = await createClient();

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && (type === "recovery" || type === "invite")
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Invalid or expired credential link") };

  if (result.error) {
    return NextResponse.redirect(new URL("/login?credentialLink=invalid", url.origin));
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
