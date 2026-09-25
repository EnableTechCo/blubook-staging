import "server-only";
import { createClient } from "@/lib/supabase/server";
import { invitationStatus, type InvitationStatus } from "@/features/onboarding/invitations";

/**
 * The invitation list, for the staff who may issue invitations. Read under the
 * caller's session: RLS admits operations and sales admin and nobody else.
 */

export interface InvitationRow {
  id: string;
  email: string;
  business_name: string | null;
  created_at: string;
  expires_at: string;
  sent_at: string | null;
  accepted_at: string | null;
  status: InvitationStatus;
  inviter: string | null;
  client: { id: string; business_name: string } | null;
}

export async function getInvitations(limit = 50): Promise<InvitationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_invitations")
    .select(
      "id,email,business_name,created_at,expires_at,sent_at,revoked_at,claimed_at,accepted_at,profiles!client_invitations_invited_by_fkey(full_name,email),clients(id,business_name)",
    )
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<
      {
        id: string;
        email: string;
        business_name: string | null;
        created_at: string;
        expires_at: string;
        sent_at: string | null;
        revoked_at: string | null;
        claimed_at: string | null;
        accepted_at: string | null;
        profiles: { full_name: string | null; email: string } | null;
        clients: { id: string; business_name: string } | null;
      }[]
    >();

  const now = new Date();
  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    business_name: row.business_name,
    created_at: row.created_at,
    expires_at: row.expires_at,
    sent_at: row.sent_at,
    accepted_at: row.accepted_at,
    status: invitationStatus(row, now),
    inviter: row.profiles?.full_name ?? row.profiles?.email ?? null,
    client: row.clients,
  }));
}
