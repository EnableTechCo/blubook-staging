"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/services/profiles";
import { createInvitation, deleteInvitation, normaliseInviteEmail, revokePriorInvitations } from "@/features/onboarding/invitationTokens";
import { sendOnboardingInvitationEmail } from "@/features/onboarding/onboardingEmail";

export type InvitationState = { message?: string; error?: string } | undefined;

const inviteSchema = z.string().trim().email().max(254);

export async function sendOnboardingInvitation(
  _previous: InvitationState,
  formData: FormData,
): Promise<InvitationState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.user_type !== "staff" || profile.status !== "active") {
    return { error: "Only active Sales staff can send onboarding invitations." };
  }
  if (!profile.staff_role || !["sales_rep", "sales_admin", "admin"].includes(profile.staff_role)) {
    return { error: "Only active Sales staff can send onboarding invitations." };
  }

  const parsed = inviteSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };

  const admin = createAdminClient() as unknown as ReturnType<typeof createAdminClient>;
  const inviteDb = admin as unknown as import("@supabase/supabase-js").SupabaseClient<any>;
  const email = normaliseInviteEmail(parsed.data);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await inviteDb
    .from("onboarding_invites")
    .select("id", { count: "exact", head: true })
    .eq("invited_by", profile.id)
    .gte("created_at", hourAgo);
  if ((count ?? 0) >= 10) return { error: "Invitation limit reached. Try again later." };

  // Keep the response identical for known and unknown accounts to prevent
  // email enumeration through this public-facing business workflow.
  const { data: existing } = await inviteDb.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (existing) return { message: "If the address is eligible, an invitation email will arrive shortly." };

  let invitationId: string | null = null;
  try {
    const invite = await createInvitation(admin, email, profile.id);
    invitationId = invite.id;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) throw new Error("Onboarding email is not configured");
    const inviteUrl = new URL("/signup", appUrl);
    inviteUrl.searchParams.set("invite", invite.token);
    const delivery = await sendOnboardingInvitationEmail(email, inviteUrl.toString());
    if (delivery.status !== "sent") {
      await deleteInvitation(admin, invite.id);
      return { error: "The invitation could not be sent. Check email configuration and try again." };
    }
    const sentAt = new Date().toISOString();
    await inviteDb.from("onboarding_invites").update({ sent_at: sentAt }).eq("id", invite.id);
    await revokePriorInvitations(admin, email, invite.id);
    return { message: "If the address is eligible, an invitation email will arrive shortly." };
  } catch (error) {
    if (invitationId) await deleteInvitation(admin, invitationId);
    console.error("Onboarding invitation could not be sent", error instanceof Error ? error.message : "unknown error");
    return { error: "The invitation could not be sent. Try again later." };
  }
}
