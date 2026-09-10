import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { env } from "@/lib/env/server";
import type { Database } from "@/types/database";

// Memoised per request. A layout, its page and the guards they call each ask
// for a client; before this they each built one, and each one re-read the
// cookie jar. React's cache() is scoped to the request, so nothing leaks
// between users, and callers keep the same `await createClient()` shape.
export const createClient = cache(async () => {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Components cannot write cookies. */ }
      },
    },
  });
});
