"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { requireStaffRole } from "@/services/staffRole";
import { sendInvitationEmail } from "@/lib/email/emailjs";
import {
  INVITATION_LIFETIME,
  invitationUrl,
  newInvitationToken,
} from "@/features/onboarding/invitations";
import { ROUTES } from "@/lib/routes";

/**
 * Staff invite a client to complete their own onboarding.
 *
 * Runs under the staff member's session, so the invitations table's own
 * policies decide who may issue, list and revoke. The admin client is used for
 * one read only: whether a login already exists for the address, which staff
 * cannot see through RLS.
 */

export type InvitationState =
  | { error: string }
  | { ok: true; email: string; delivery: "sent" }
  | { ok: true; email: string; delivery: "not_sent"; reason: string; link: string }
  | undefined;

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter the client's email address"),
  businessName: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => value || undefined),
});

const APPROVERS = ["operations", "sales_admin"] as const;

async function issueInvitation(input: { email: string; businessName?: string }): Promise<InvitationState> {
  const staff = await getCurrentProfile();
  if (!staff) return { error: "Not authenticated." };

  const { data: existing } = await createAdminClient()
    .from("profiles")
    .select("id")
    .eq("email", input.email)
    .maybeSingle();
  if (existing) return { error: "A BluBook account already exists for this email address." };

  const supabase = await createClient();

  // One working link per address: a new invitation retires any older one.
  await supabase
    .from("client_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("email", input.email)
    .is("accepted_at", null)
    .is("revoked_at", null);

  const { token, tokenHash } = newInvitationToken();
  const { data: invitation, error } = await supabase
    .from("client_invitations")
    .insert({
      email: input.email,
      business_name: input.businessName ?? null,
      token_hash: tokenHash,
      invited_by: staff.id,
    })
    .select("id")
    .single();
  if (error || !invitation) return { error: "The invitation could not be created. Try again." };

  const link = invitationUrl(token);
  const email = await sendInvitationEmail({ toEmail: input.email, inviteUrl: link, expiresIn: INVITATION_LIFETIME });

  revalidatePath(ROUTES.onboard);
  if (email.status === "sent") {
    await supabase
      .from("client_invitations")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", invitation.id);
    return { ok: true, email: input.email, delivery: "sent" };
  }

  // The token exists nowhere but this response, so this is the one chance to
  // hand the link over when the email did not go.
  return { ok: true, email: input.email, delivery: "not_sent", reason: email.reason, link };
}

export async function inviteClient(_prev: InvitationState, formData: FormData): Promise<InvitationState> {
  const denied = await requireStaffRole(...APPROVERS);
  if (denied) return { error: denied };

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    businessName: formData.get("businessName") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the invitation details." };

  return issueInvitation(parsed.data);
}

/** A fresh link for the same client. The old one stops working. */
export async function resendInvitation(_prev: InvitationState, formData: FormData): Promise<InvitationState> {
  const denied = await requireStaffRole(...APPROVERS);
  if (denied) return { error: denied };

  const id = z.string().uuid().safeParse(formData.get("invitationId"));
  if (!id.success) return { error: "Invalid invitation." };

  const { data: previous } = await (await createClient())
    .from("client_invitations")
    .select("email,business_name,accepted_at")
    .eq("id", id.data)
    .maybeSingle();
  if (!previous) return { error: "Invitation not found." };
  if (previous.accepted_at) return { error: "This invitation has already been used." };

  return issueInvitation({ email: previous.email, businessName: previous.business_name ?? undefined });
}

export async function revokeInvitation(formData: FormData): Promise<void> {
  if (await requireStaffRole(...APPROVERS)) return;
  const id = z.string().uuid().safeParse(formData.get("invitationId"));
  if (!id.success) return;

  await (await createClient())
    .from("client_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id.data)
    .is("accepted_at", null)
    .is("revoked_at", null);
  revalidatePath(ROUTES.onboard);
}
