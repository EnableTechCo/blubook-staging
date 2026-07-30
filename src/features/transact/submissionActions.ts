"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import {
  MAX_DOCUMENTS_PER_SUBMISSION,
  type UploadedDocumentInput,
} from "@/features/documents/uploadPolicy";
import {
  persistRequestDocuments,
  removeUploadedDocuments,
} from "@/features/documents/requestAttachments";

const uploadedDocumentSchema = z.object({
  locator: z.string().trim().min(1).max(1000),
  title: z.string().trim().min(1).max(240),
  mimeType: z.string().trim().min(1).max(160),
  sizeBytes: z.number().int().positive(),
}) satisfies z.ZodType<UploadedDocumentInput>;

const attachments = z
  .array(uploadedDocumentSchema)
  .min(1, "Attach at least one document.")
  .max(MAX_DOCUMENTS_PER_SUBMISSION);

const purchaseOrderSchema = z.object({
  kind: z.literal("purchase_order"),
  amount: z.string().trim().max(80).optional(),
  currency: z.string().trim().min(3).max(3).default("ZAR"),
  description: z.string().trim().min(1, "Describe the purchase.").max(2000),
  files: attachments,
  notes: z.string().trim().max(2000).optional(),
  purchaseOrderNumber: z.string().trim().min(1, "Enter the purchase order number.").max(120),
  requiredDate: z.string().trim().max(40).optional(),
  supplier: z.string().trim().min(1, "Enter the supplier or recipient.").max(200),
});

const tenderSchema = z.object({
  kind: z.literal("tender_submission"),
  closingAt: z.string().trim().max(80).optional(),
  files: attachments,
  issuer: z.string().trim().min(1, "Enter the issuing organisation.").max(200),
  notes: z.string().trim().max(2000).optional(),
  tenderReference: z.string().trim().min(1, "Enter the tender reference.").max(120),
  tenderTitle: z.string().trim().min(1, "Enter the tender title.").max(240),
});

const submissionSchema = z.discriminatedUnion("kind", [purchaseOrderSchema, tenderSchema]);
type SubmissionInput = z.infer<typeof submissionSchema>;

export type SubmitTransactionResult =
  | { ok: true; reference: string; requestId: string }
  | { ok: false; error: string };

const SERVICE_SLUGS: Record<SubmissionInput["kind"], string> = {
  purchase_order: "purchase-order-submission",
  tender_submission: "tender-submission",
};

function summary(input: SubmissionInput): { description: string; title: string } {
  if (input.kind === "purchase_order") {
    return {
      title: `Purchase order ${input.purchaseOrderNumber}`,
      description: [
        `Purchase order: ${input.purchaseOrderNumber}`,
        `Supplier or recipient: ${input.supplier}`,
        input.amount ? `Amount: ${input.currency.toUpperCase()} ${input.amount}` : null,
        input.requiredDate ? `Required date: ${input.requiredDate}` : null,
        "",
        input.description,
        input.notes ? `\nNotes:\n${input.notes}` : null,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    };
  }

  return {
    title: `${input.tenderReference} · ${input.tenderTitle}`,
    description: [
      `Tender reference: ${input.tenderReference}`,
      `Issuing organisation: ${input.issuer}`,
      input.closingAt ? `Closing date and time: ${input.closingAt}` : null,
      "",
      input.notes || "No additional notes supplied.",
    ]
      .filter((line) => line !== null)
      .join("\n"),
  };
}

export async function submitDocumentTransaction(input: unknown): Promise<SubmitTransactionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not authenticated." };
  if (profile.user_type !== "client") {
    return { ok: false, error: "Only clients can submit transactions." };
  }

  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid submission." };
  }
  const submission = parsed.data;

  const supabase = await createClient();
  const [{ data: client }, { data: service }] = await Promise.all([
    supabase.from("clients").select("id").maybeSingle(),
    supabase
      .from("services")
      .select("id")
      .eq("slug", SERVICE_SLUGS[submission.kind])
      .eq("active", true)
      .maybeSingle(),
  ]);

  if (!client) {
    await removeUploadedDocuments(submission.files);
    return { ok: false, error: "No client account is linked to your profile." };
  }
  if (!service) {
    await removeUploadedDocuments(submission.files);
    return {
      ok: false,
      error:
        submission.kind === "purchase_order"
          ? "Purchase Order Submission is not configured yet."
          : "Tender Submission is not configured yet.",
    };
  }

  let purchaseOrderCategoryId: string | null = null;
  if (submission.kind === "purchase_order") {
    const { data: category } = await supabase
      .from("document_categories")
      .select("id")
      .eq("slug", "purchase-orders")
      .eq("active", true)
      .maybeSingle();
    purchaseOrderCategoryId = category?.id ?? null;
  }

  // A completed browser retry carries the same first object locator. Reuse the
  // linked request instead of creating another SR. A strict concurrency lock
  // would require a database constraint, which this no-migration release avoids.
  const admin = createAdminClient();
  const { data: existingDocument } = await admin
    .from("documents")
    .select("id")
    .eq("client_id", client.id)
    .eq("storage_path", submission.files[0].locator)
    .maybeSingle();
  if (existingDocument) {
    const { data: existingLink } = await admin
      .from("request_documents")
      .select("request_id,service_requests(reference)")
      .eq("document_id", existingDocument.id)
      .maybeSingle<{
        request_id: string;
        service_requests: { reference: string } | null;
      }>();
    if (existingLink?.service_requests) {
      return {
        ok: true,
        reference: existingLink.service_requests.reference,
        requestId: existingLink.request_id,
      };
    }
  }

  const content = summary(submission);
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .insert({
      client_id: client.id,
      description: content.description,
      origin: "client",
      reference: "",
      request_type: submission.kind,
      service_id: service.id,
      title: content.title,
    })
    .select("id,reference")
    .single();

  if (requestError || !request) {
    await removeUploadedDocuments(submission.files);
    return { ok: false, error: requestError?.message ?? "Could not create the request." };
  }

  const persisted = await persistRequestDocuments({
    categoryId: purchaseOrderCategoryId,
    clientId: client.id,
    files: submission.files as UploadedDocumentInput[],
    profileId: profile.id,
    requestId: request.id,
  });
  if (persisted.error) {
    await createAdminClient().from("service_requests").delete().eq("id", request.id);
    return { ok: false, error: persisted.error };
  }

  const { error: routeError } = await admin.rpc("route_request", {
    p_request_id: request.id,
  });
  if (routeError) {
    await admin
      .from("service_requests")
      .update({ status: "awaiting_assignment" })
      .eq("id", request.id)
      .eq("status", "new");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/transact");
  revalidatePath("/dashboard/transact/requests");
  return { ok: true, reference: request.reference, requestId: request.id };
}
