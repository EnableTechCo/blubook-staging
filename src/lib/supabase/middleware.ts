import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthRoute, isProtectedRoute } from "@/lib/auth/routeAccess";
import { env } from "@/lib/env/server";
import type { Database } from "@/types/database";

// Refreshes the Supabase auth cookies on every request and enforces coarse
// route access: unauthenticated users are bounced off protected areas, and
// signed-in users are kept out of the auth pages. Fine-grained authorisation
// (by user_type) lives in RLS and per-feature checks, not here.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  const protectedRoute = isProtectedRoute(pathname);
  const authRoute = isAuthRoute(pathname);

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser revalidates the token against the auth server. If that server is
  // unreachable we fail closed and treat the request as unauthenticated.
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    user = null;
  }

  // Existing sessions must be checked as well as new sign-ins. Scope the
  // profile lookup to the authenticated user because Staff RLS can read more
  // than one profile.
  if (user && (protectedRoute || authRoute)) {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single();

      if (error || !profile || profile.status !== "active") {
        await supabase.auth.signOut();
        user = null;
      }
    } catch {
      user = null;
    }
  }

  if (!user && protectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (user && authRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return copyCookies(response, NextResponse.redirect(url));
  }

  return response;
}

// Carry any refreshed auth cookies onto a redirect response so the session
// stays in sync even when we short-circuit the request.
function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}
