import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Admin = SupabaseClient<Database>;

export const ONBOARDING_CHECK_SLUG = "blubook-onboarding-check";

function welcomeBody(businessName: string, deliveredCount: number): string {
  const documents =
    deliveredCount === 0
      ? "Anything BluBook issues to you will arrive as its own request and be filed in your Document Archive."
      : `We have issued ${deliveredCount} document${deliveredCount === 1 ? "" : "s"} to you. ` +
        `Each one is its own request, and each is filed in your Document Archive. ` +
        `Open ${deliveredCount === 1 ? "it" : "them"} and acknowledge receipt to close ${deliveredCount === 1 ? "it" : "them"}.`;

  return [
    `Welcome to BluBook, ${businessName}.`,
    "",
    `Your workspace is live. ${documents}`,
    "",
    "You can raise your own requests from Transact, track them under Reports, and reply here at any time.",
  ].join("\n");
}

export interface OnboardingCheckResult {
  requestId: string;
  reference: string;
}

// Raises the welcome request, posts the message that puts it in the client's
// inbox, then closes it. Deliberately carries no document of its own: the
// default document library is what issues documents, and this stays a plain
// welcome so it still lands even when the library is empty.
//
// Any failure throws so the caller's rollback removes the account.
export async function runOnboardingCheck(
  admin: Admin,
  options: { clientId: string; staffProfileId: string; businessName: string; deliveredCount: number },
): Promise<OnboardingCheckResult> {
  const { data: service, error: serviceErr } = await admin
    .from("services")
    .select("id")
    .eq("slug", ONBOARDING_CHECK_SLUG)
    .maybeSingle();
  if (serviceErr || !service) {
    throw new Error("The onboarding check service is missing from the catalogue.");
  }

  // Raised with no provider and no work group, so routing never touches it.
  const { data: request, error: requestErr } = await admin
    .from("service_requests")
    .insert({
      reference: "", // filled by the set_request_reference trigger
      origin: "system",
      client_id: options.clientId,
      service_id: service.id,
      title: "Welcome to BluBook",
      description: "Raised automatically when the account went live.",
    })
    .select("id,reference")
    .single();
  if (requestErr || !request) {
    throw new Error(requestErr?.message ?? "Could not raise the welcome request.");
  }

  const { error: messageErr } = await admin.from("request_messages").insert({
    request_id: request.id,
    sender_id: options.staffProfileId,
    sender_role: "staff",
    body: welcomeBody(options.businessName, options.deliveredCount),
  });
  if (messageErr) throw new Error(messageErr.message);

  // The status trigger notifies the client's primary contact on close.
  const { error: closeErr } = await admin
    .from("service_requests")
    .update({ status: "completed" })
    .eq("id", request.id);
  if (closeErr) throw new Error(closeErr.message);

  return { requestId: request.id, reference: request.reference };
}
