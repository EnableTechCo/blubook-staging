import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;

/**
 * The signed-in user's profile, or null when there is no authenticated user or
 * the profile cannot be read. RLS guarantees a user only ever reads their own
 * row here.
 *
 * Two things keep this off the network as far as possible, because it sits on
 * the critical path of every page:
 *
 * - It is memoised per request with React's cache(). The layout, the page and
 *   the role guard the page calls all ask this question; before, each answer
 *   was a fresh pair of round trips to the database region.
 * - The token is checked with getClaims() rather than getUser(). The project
 *   signs tokens with an asymmetric key, so the signature is verified locally
 *   against the published key set, which supabase-js caches process-wide.
 *   getUser() asked the auth server on every call. If a token were ever
 *   symmetrically signed, getClaims() falls back to that same call, so this is
 *   never less safe than before.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data;
});
