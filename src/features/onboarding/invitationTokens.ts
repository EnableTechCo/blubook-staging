import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AdminClient = SupabaseClient<Database>;
type InviteRow = {
  id: string;
  email: string;
  invited_by: string;
  token_hash: string;
  expires_at: string;
  claimed_at: string | null;
  consumed_at: string | null;
};

const table = (admin: AdminClient) =>
  (admin as unknown as SupabaseClient<any>).from("onboarding_invites");

export const normaliseInviteEmail = (email: string) => email.trim().toLowerCase();
export const hashInviteToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function newInviteToken() {
  return randomBytes(32).toString("hex");
}

export async function createInvitation(
  admin: AdminClient,
  email: string,
  invitedBy: string,
): Promise<{ id: string; token: string }> {
  const token = newInviteToken();
  const { data, error } = await table(admin)
    .insert({ email: normaliseInviteEmail(email), token_hash: hashInviteToken(token), invited_by: invitedBy })
    .select("id")
    .single();
  if (error || !data) throw new Error("Could not create onboarding invitation");
  return { id: data.id as string, token };
}

export async function invitationForToken(admin: AdminClient, token: string): Promise<InviteRow | null> {
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  const { data } = await table(admin)
    .select("id,email,invited_by,token_hash,expires_at,claimed_at,consumed_at")
    .eq("token_hash", hashInviteToken(token))
    .is("claimed_at", null)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return data as InviteRow | null;
}

/** Atomically reserve a valid invite for one submission. */
export async function claimInvitation(
  admin: AdminClient,
  token: string,
  email: string,
): Promise<string | null> {
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  const now = new Date().toISOString();
  const { data } = await table(admin)
    .update({ claimed_at: now })
    .eq("token_hash", hashInviteToken(token))
    .eq("email", normaliseInviteEmail(email))
    .is("claimed_at", null)
    .is("consumed_at", null)
    .gt("expires_at", now)
    .select("id")
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function releaseInvitation(admin: AdminClient, inviteId: string) {
  await table(admin).update({ claimed_at: null }).eq("id", inviteId).is("consumed_at", null);
}

export async function consumeInvitation(admin: AdminClient, inviteId: string, clientId: string) {
  const { error } = await table(admin)
    .update({ consumed_at: new Date().toISOString(), client_id: clientId })
    .eq("id", inviteId)
    .not("claimed_at", "is", null)
    .is("consumed_at", null);
  if (error) throw new Error("Could not complete onboarding invitation");
}

export async function revokePriorInvitations(admin: AdminClient, email: string, exceptId: string) {
  const now = new Date().toISOString();
  const { error } = await table(admin)
    .update({ expires_at: now })
    .eq("email", normaliseInviteEmail(email))
    .neq("id", exceptId)
    .is("consumed_at", null);
  if (error) throw new Error("Could not revoke previous onboarding invitations");
}

export async function deleteInvitation(admin: AdminClient, inviteId: string) {
  await table(admin).delete().eq("id", inviteId);
}
