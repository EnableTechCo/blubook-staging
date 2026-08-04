import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Admin = SupabaseClient<Database>;

export const ONBOARDING_CHECK_SLUG = "blubook-onboarding-check";

// A minimal but structurally valid single-page PDF, assembled here so the check
// depends on no binary asset. Offsets in the xref table have to point at the
// real byte positions, so the objects are laid out first and measured.
export function blankTestPdf(): Uint8Array {
  const header = "%PDF-1.4\n";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> >>",
  ];

  let body = "";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(header.length + body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = header.length + body.length;
  const pad = (value: number) => String(value).padStart(10, "0");
  const xref =
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets.map((offset) => `${pad(offset)} 00000 n \n`).join("");
  const trailer =
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  return new TextEncoder().encode(header + body + xref + trailer);
}

function welcomeBody(businessName: string): string {
  return [
    `Welcome to BluBook, ${businessName}.`,
    "",
    "Your workspace is live. This request was raised automatically to confirm everything is working: a document has been attached to it and filed in your Document Archive, and the request has been closed.",
    "",
    "You can raise your own requests from Transact, track them under Reports, and reply here at any time.",
  ].join("\n");
}

export interface OnboardingCheckResult {
  requestId: string;
  reference: string;
  documentId: string;
  storagePath: string;
}

// Raises one request, attaches a document, posts the welcome message, then
// closes it. Any failure throws so the caller's rollback removes the account.
export async function runOnboardingCheck(
  admin: Admin,
  options: { clientId: string; clientProfileId: string; staffProfileId: string; businessName: string },
): Promise<OnboardingCheckResult> {
  const { data: service, error: serviceErr } = await admin
    .from("services")
    .select("id")
    .eq("slug", ONBOARDING_CHECK_SLUG)
    .maybeSingle();
  if (serviceErr || !service) {
    throw new Error("The onboarding check service is missing from the catalogue.");
  }

  // 1) Raise it. No provider and no work group, so routing never touches it.
  const { data: request, error: requestErr } = await admin
    .from("service_requests")
    .insert({
      reference: "", // filled by the set_request_reference trigger
      origin: "system",
      client_id: options.clientId,
      service_id: service.id,
      title: "Welcome to BluBook",
      description:
        "Raised automatically when the account went live, to confirm requests and the document archive are working.",
    })
    .select("id,reference")
    .single();
  if (requestErr || !request) {
    throw new Error(requestErr?.message ?? "Could not raise the onboarding check.");
  }

  // 2) Attach the document. Uploaded first so a failed insert leaves no row.
  const storagePath = `${options.clientId}/${crypto.randomUUID()}-blubook-test-document.pdf`;
  const { error: uploadErr } = await admin.storage
    .from("documents")
    .upload(storagePath, blankTestPdf(), { contentType: "application/pdf", upsert: false });
  if (uploadErr) throw new Error(`Test document upload failed: ${uploadErr.message}`);

  const pdfBytes = blankTestPdf().byteLength;
  const { data: document, error: documentErr } = await admin
    .from("documents")
    .insert({
      client_id: options.clientId,
      uploaded_by: options.staffProfileId,
      category: "generated",
      title: "BluBook test document",
      storage_path: storagePath,
      mime_type: "application/pdf",
      size_bytes: pdfBytes,
    })
    .select("id")
    .single();
  if (documentErr || !document) {
    await admin.storage.from("documents").remove([storagePath]);
    throw new Error(documentErr?.message ?? "Could not save the test document.");
  }

  const { error: linkErr } = await admin
    .from("request_documents")
    .insert({ request_id: request.id, document_id: document.id });
  if (linkErr) throw new Error(linkErr.message);

  // 3) The welcome message, which is what puts this in the client's inbox.
  const { error: messageErr } = await admin.from("request_messages").insert({
    request_id: request.id,
    sender_id: options.staffProfileId,
    sender_role: "staff",
    body: welcomeBody(options.businessName),
  });
  if (messageErr) throw new Error(messageErr.message);

  // 4) Close it. The status trigger notifies the client's primary contact.
  const { error: closeErr } = await admin
    .from("service_requests")
    .update({ status: "completed" })
    .eq("id", request.id);
  if (closeErr) throw new Error(closeErr.message);

  return {
    requestId: request.id,
    reference: request.reference,
    documentId: document.id,
    storagePath,
  };
}
