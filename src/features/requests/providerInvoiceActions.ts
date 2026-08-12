"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import {
  removeUploadedDocuments,
  verifyUploadedDocuments,
} from "@/features/documents/requestAttachments";
import type { UploadedDocumentInput } from "@/features/documents/uploadPolicy";
import type { Json } from "@/types/database";

const schema = z.object({
  requestId: z.string().uuid(),
  invoiceNumber: z.string().trim().min(1).max(120),
  document: z.object({
    locator: z.string().min(1),
    title: z.string().min(1).max(240),
    mimeType: z.string().min(1).max(160),
    sizeBytes: z.number().int().positive(),
  }),
});

export type InvoiceCompletionResult = { ok: true } | { ok: false; error: string };

export async function completeSalesOrderWithInvoice(input: unknown): Promise<InvoiceCompletionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid invoice." };
  const file = parsed.data.document as UploadedDocumentInput;
  const profile = await getCurrentProfile();
  if (!profile || profile.user_type !== "service_provider") {
    await removeUploadedDocuments([file]);
    return { ok: false, error: "Only the assigned Sales Partner may complete this request." };
  }

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("service_requests")
    .select("id,client_id")
    .eq("id", parsed.data.requestId)
    .maybeSingle();
  if (!request) {
    await removeUploadedDocuments([file]);
    return { ok: false, error: "Sales order not found." };
  }
  const verification = await verifyUploadedDocuments({ clientId: request.client_id, files: [file] });
  if (verification.error) return { ok: false, error: verification.error };

  const { error } = await supabase.rpc("complete_sales_order_with_invoice", {
    p_document: { ...verification.documents[0] } as Json,
    p_invoice_number: parsed.data.invoiceNumber,
    p_request_id: request.id,
  });
  if (error) {
    await removeUploadedDocuments([file]);
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/sales/pipeline");
  revalidatePath("/dashboard/reports/requests");
  revalidatePath(`/dashboard/reports/requests/${request.id}`);
  return { ok: true };
}
