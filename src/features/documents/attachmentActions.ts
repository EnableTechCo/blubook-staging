"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { persistRequestDocuments } from "@/features/documents/requestAttachments";
import {
  MAX_DOCUMENTS_PER_SUBMISSION,
  type UploadedDocumentInput,
} from "@/features/documents/uploadPolicy";

const uploadedDocumentSchema = z.object({
  locator: z.string().trim().min(1).max(1000),
  title: z.string().trim().min(1).max(240),
  mimeType: z.string().trim().min(1).max(160),
  sizeBytes: z.number().int().positive(),
}) satisfies z.ZodType<UploadedDocumentInput>;

const attachmentSchema = z.object({
  files: z.array(uploadedDocumentSchema).min(1).max(MAX_DOCUMENTS_PER_SUBMISSION),
  requestId: z.string().uuid(),
});

export type AttachDocumentsResult = { ok: true } | { ok: false; error: string };

export async function attachUploadedDocuments(input: unknown): Promise<AttachDocumentsResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not authenticated." };
  if (profile.user_type === "staff") {
    return { ok: false, error: "Staff cannot add counterparty request files." };
  }

  const parsed = attachmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid attachment." };
  }

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("service_requests")
    .select("id,client_id,provider_id,status")
    .eq("id", parsed.data.requestId)
    .maybeSingle();
  if (!request) return { ok: false, error: "Request not found." };
  if (request.status === "completed" || request.status === "cancelled") {
    return { ok: false, error: "This request no longer accepts files." };
  }

  if (profile.user_type === "client") {
    const { data: client } = await supabase.from("clients").select("id").maybeSingle();
    if (!client || request.client_id !== client.id) {
      return { ok: false, error: "Request not found." };
    }
  } else {
    const { data: provider } = await supabase.from("providers").select("id").maybeSingle();
    if (!provider || request.provider_id !== provider.id) {
      return { ok: false, error: "Request not found." };
    }
  }

  const persisted = await persistRequestDocuments({
    clientId: request.client_id,
    files: parsed.data.files,
    profileId: profile.id,
    requestId: request.id,
  });
  if (persisted.error) return { ok: false, error: persisted.error };

  revalidatePath(`/dashboard/transact/requests/${request.id}`);
  revalidatePath("/dashboard/documents");
  return { ok: true };
}
