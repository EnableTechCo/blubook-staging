import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { Admin } from "@/features/onboarding/onboardClientSteps";

/**
 * Client invitations: the token, its digest, and the rules for when a link
 * still works.
 *
 * The token is 32 random bytes, base64url-encoded, and it exists in exactly one
 * place: the link that is emailed. The database stores only its SHA-256
 * digest, so a copy of the table cannot be turned back into working links.
 *
 * The invite page and the submission run for someone who is not signed in, so
 * they read the table with the service role, by digest. Staff list and issue
 * invitations under their own session, where RLS decides who may.
 */

export const INVITATION_LIFETIME = "7 days";

// 32 bytes in base64url is always 43 characters from this alphabet. Anything
// else is not a token, and is refused before it reaches the database.
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;

export function newInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isWellFormedToken(token: string): boolean {
  return TOKEN_SHAPE.test(token);
}

export function invitationUrl(token: string, base = process.env.NEXT_PUBLIC_APP_URL ?? ""): string {
  return `${base.replace(/\/+$/, "")}/invite/${token}`;
}

export type InvitationStatus = "open" | "in_use" | "accepted" | "revoked" | "expired";

interface InvitationTimes {
  expires_at: string;
  revoked_at: string | null;
  claimed_at: string | null;
  accepted_at: string | null;
}

/**
 * Where an invitation stands. Accepted and revoked are final whatever the
 * clock says; an unused one expires; one being submitted right now is in use.
 */
export function invitationStatus(invitation: InvitationTimes, now: Date = new Date()): InvitationStatus {
  if (invitation.accepted_at) return "accepted";
  if (invitation.revoked_at) return "revoked";
  if (new Date(invitation.expires_at).getTime() <= now.getTime()) return "expired";
  if (invitation.claimed_at) return "in_use";
  return "open";
}

export interface OpenInvitation {
  id: string;
  email: string;
  business_name: string | null;
  invited_by: string | null;
}

export type InvitationLookup =
  | { invitation: OpenInvitation }
  | { problem: "invalid" | Exclude<InvitationStatus, "open"> };

/** The invitation behind a link, if the link still works. */
export async function findInvitation(admin: Admin, token: string): Promise<InvitationLookup> {
  if (!isWellFormedToken(token)) return { problem: "invalid" };

  const { data } = await admin
    .from("client_invitations")
    .select("id,email,business_name,invited_by,expires_at,revoked_at,claimed_at,accepted_at")
    .eq("token_hash", hashInvitationToken(token))
    .maybeSingle();
  if (!data) return { problem: "invalid" };

  const status = invitationStatus(data);
  if (status !== "open") return { problem: status };
  return {
    invitation: {
      id: data.id,
      email: data.email,
      business_name: data.business_name,
      invited_by: data.invited_by,
    },
  };
}

/**
 * Take the invitation for one submission. Conditional on it still being open,
 * so of two tabs submitting the same link only one gets true.
 */
export async function claimInvitation(admin: Admin, invitationId: string): Promise<boolean> {
  const { data, error } = await admin
    .from("client_invitations")
    .update({ claimed_at: new Date().toISOString() })
    .eq("id", invitationId)
    .is("claimed_at", null)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return !error && (data?.length ?? 0) === 1;
}

/** Hand the invitation back after a submission failed, so the client can retry. */
export async function releaseInvitation(admin: Admin, invitationId: string): Promise<void> {
  await admin
    .from("client_invitations")
    .update({ claimed_at: null })
    .eq("id", invitationId)
    .is("accepted_at", null);
}

/** Close the invitation against the client it created. */
export async function acceptInvitation(admin: Admin, invitationId: string, clientId: string): Promise<void> {
  const { error } = await admin
    .from("client_invitations")
    .update({ accepted_at: new Date().toISOString(), client_id: clientId })
    .eq("id", invitationId);
  if (error) throw new Error(error.message);
}

/** A person-readable reason a link no longer works, for the invite page. */
export const INVITATION_PROBLEM: Record<Exclude<InvitationLookup, { invitation: OpenInvitation }>["problem"], string> = {
  invalid: "This invitation link is not valid. Check that the whole link was copied, or ask BluBook for a new one.",
  expired: "This invitation has expired. Ask your BluBook contact to send a new one.",
  revoked: "This invitation has been withdrawn. Ask your BluBook contact to send a new one.",
  accepted: "This invitation has already been used. Sign in with the email and password you chose.",
  in_use: "This invitation is being completed in another window. If that was not you, try again in a few minutes.",
};
