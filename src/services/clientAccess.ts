import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

/**
 * The client- and provider-side twins of requireStaffRole().
 *
 * Before this file, sixteen client pages and two provider pages each asked
 * "is this a client?" in their own words, and two feature modules each kept a
 * private copy of "which client is signed in?" — copies that had already
 * drifted: one filtered by profile, the other leaned on RLS alone. Same name,
 * two contracts. This is the one answer, with the same shape staffRole.ts
 * uses: a message to show the caller, or null when they may proceed.
 *
 * The database is still what enforces access. These exist so the refusal is
 * honest — an UPDATE blocked by RLS affects zero rows and raises nothing, so
 * without a check here a caller is told the save succeeded while nothing
 * changed.
 */

export async function requireClient(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) return "Not authenticated.";
  return profile.user_type === "client" ? null : "Only a client can do this.";
}

export async function requireProvider(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) return "Not authenticated.";
  return profile.user_type === "service_provider"
    ? null
    : "Only a service partner can do this.";
}

/**
 * The signed-in client's record, or a message saying why there isn't one.
 *
 * Filtered by profile explicitly rather than trusting RLS to return a single
 * row. RLS does guarantee that today — clients_select is `id =
 * current_client_id() or is_staff()` — but a helper that only works because a
 * policy elsewhere happens to be narrow is a helper waiting to break when that
 * policy is widened. The filter makes the intent legible here, where it is read.
 */
export async function currentClient(): Promise<{ id: string } | string> {
  const profile = await getCurrentProfile();
  if (!profile) return "Not authenticated.";
  if (profile.user_type !== "client") return "Only a client can do this.";

  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("primary_profile_id", profile.id)
    .maybeSingle();

  if (!data) return "No client record is linked to this account.";
  return { id: data.id };
}
