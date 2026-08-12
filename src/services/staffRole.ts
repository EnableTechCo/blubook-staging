import "server-only";
import type { Enums } from "@/types/database";
import { getCurrentProfile } from "@/services/profiles";
import { rolesForRoute, type StaffRoute } from "@/services/capabilities";

export type StaffRole = Enums<"staff_role">;

/**
 * The application-side twin of the database's has_staff_role().
 *
 * The database is what actually enforces this — a policy cannot be talked out
 * of. This exists so the refusal is *honest*: an UPDATE blocked by RLS affects
 * zero rows and raises nothing, so without a check here the caller is told the
 * save succeeded while nothing changed. It also covers the actions that run
 * through the admin client, where RLS is bypassed entirely and this is the only
 * check there is.
 *
 * Admin passes every check without being listed, exactly as in the database.
 * Keeping the two rules identical is the point; if they disagree, the one that
 * is wrong is this one.
 *
 * Returns a message to show the caller, or null when they may proceed.
 */
export async function requireStaffRole(...roles: StaffRole[]): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) return "Not authenticated.";
  if (profile.user_type !== "staff") return "Only staff can do this.";
  if (profile.staff_role === "admin") return null;
  if (profile.staff_role && roles.includes(profile.staff_role)) return null;

  return roles.includes("admin")
    ? "Only an administrator can do this."
    : `This is restricted to ${roles.join(" or ")} staff.`;
}

/**
 * Guard a page using the same entry the nav renders.
 *
 * A page and its nav item asking the question separately is how a link that
 * bounces you gets shipped: both were right when they were written, and then
 * only one of them was changed. Here there is one answer and two readers.
 */
export async function requireStaffRoute(href: StaffRoute): Promise<string | null> {
  const roles = rolesForRoute(href);
  if (roles === null) {
    const profile = await getCurrentProfile();
    if (!profile) return "Not authenticated.";
    return profile.user_type === "staff" ? null : "Only staff can do this.";
  }

  return requireStaffRole(...roles);
}
