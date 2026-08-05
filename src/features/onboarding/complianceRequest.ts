import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ONBOARDING_CHECK_SLUG } from "@/features/onboarding/onboardingCheck";

type Admin = SupabaseClient<Database>;

export interface ComplianceChecklistItem {
  id: string;
  name: string;
}

function complianceMessage(businessName: string, items: ComplianceChecklistItem[]): string {
  const list = items.map((item) => `• ${item.name}`).join("\n");

  return [
    `To complete the account setup for ${businessName}, please upload the documents listed below.`,
    "",
    list,
    "",
    "Use the upload controls at the bottom of this message. Each file is automatically linked to your BluBook account and the correct checklist item, so you do not need to include your Customer ID or business details.",
    "",
    "BluBook staff will review every document. If a document is rejected, return here to upload a replacement.",
  ].join("\n");
}

// Creates a separate, client-visible conversation immediately after the
// welcome thread. It deliberately uses the internal onboarding-check service:
// no provider or work group should receive private compliance documents.
export async function createComplianceRequest(
  admin: Admin,
  options: {
    onboardingId: string;
    clientId: string;
    staffProfileId: string;
    businessName: string;
    items: ComplianceChecklistItem[];
  },
): Promise<string | null> {
  if (options.items.length === 0) return null;

  const { data: service, error: serviceError } = await admin
    .from("services")
    .select("id")
    .eq("slug", ONBOARDING_CHECK_SLUG)
    .maybeSingle();
  if (serviceError || !service) {
    throw new Error("The onboarding check service is missing from the catalogue.");
  }

  const { data: request, error: requestError } = await admin
    .from("service_requests")
    .insert({
      reference: "",
      origin: "system",
      client_id: options.clientId,
      created_by: options.staffProfileId,
      service_id: service.id,
      title: "Documents required for account setup",
      description: "Upload the compliance documents required to complete your account setup.",
    })
    .select("id")
    .single();
  if (requestError || !request) {
    throw new Error(requestError?.message ?? "Could not create the compliance request.");
  }

  const { data: linkedOnboarding, error: linkError } = await admin
    .from("onboardings")
    .update({ compliance_request_id: request.id })
    .eq("id", options.onboardingId)
    .select("id")
    .single();
  if (linkError || !linkedOnboarding) {
    throw new Error(linkError?.message ?? "Could not link the compliance conversation.");
  }

  const { error: messageError } = await admin.from("request_messages").insert({
    request_id: request.id,
    sender_id: options.staffProfileId,
    sender_role: "staff",
    body: complianceMessage(options.businessName, options.items),
  });
  if (messageError) throw new Error(messageError.message);

  return request.id;
}
