"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { requireStaffRole } from "@/services/staffRole";

export type AssignRoleState = { error: string } | { ok: true; message: string } | undefined;

const assignSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(["sales_rep", "sales_admin", "operations", "admin", "marketing"]),
});

/**
 * Give a staff member a role.
 *
 * The database checks the caller again inside set_staff_role rather than
 * trusting this guard, which is the arrangement everywhere else in the split:
 * this one exists so the refusal is a sentence rather than silence.
 */
export async function assignStaffRole(
  _previous: AssignRoleState,
  formData: FormData,
): Promise<AssignRoleState> {
  const denied = await requireStaffRole("admin");
  if (denied) return { error: denied };

  const parsed = assignSchema.safeParse({
    profileId: formData.get("profileId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Choose a role to assign." };

  // Demoting yourself is allowed — an administrator handing over is a real
  // thing — but it is worth saying out loud, because the page it was done from
  // disappears on the next render.
  const actor = await getCurrentProfile();
  const isSelf = actor?.id === parsed.data.profileId;

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_staff_role", {
    p_profile_id: parsed.data.profileId,
    p_role: parsed.data.role,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff-roles");

  return {
    ok: true,
    message:
      isSelf && parsed.data.role !== "admin"
        ? "You are no longer an administrator. This page is now closed to you."
        : "Role updated.",
  };
}
