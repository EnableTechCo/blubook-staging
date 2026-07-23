import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env/server";
import type { Database } from "@/types/database";

// Privileged client using the service-role key. It BYPASSES RLS, so it must
// only ever be used from server code after the caller has been authorized
// (e.g. confirmed to be staff). Never expose this to the browser.
export function createAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured; privileged operations are unavailable.",
    );
  }
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
