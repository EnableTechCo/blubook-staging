"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { documentStorage } from "@/lib/storage/documents";
import { getCurrentProfile } from "@/services/profiles";
import {
  documentPolicyError,
  type PreparedDocumentUpload,
} from "@/features/documents/uploadPolicy";

const prepareSchema = z.object({
  name: z.string().trim().min(1).max(240),
  requestId: z.string().uuid().optional(),
  // Financial evidence has no request behind it: a premium finance partner
  // files it against the client directly, so the client is named instead.
  financialsClientId: z.string().uuid().optional(),
  size: z.number().int().positive(),
  type: z.string().trim().min(1).max(160),
});

export type PrepareUploadResult =
  | {
      ok: true;
      upload: PreparedDocumentUpload;
    }
  | { ok: false; error: string };

function safeFilename(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/[^\w.-]/g, "_")
    .replace(/_+/g, "_")
    .slice(-180);
  return normalized || "document";
}

export async function prepareDirectDocumentUpload(
  input: unknown,
): Promise<PrepareUploadResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not authenticated." };
  if (profile.user_type === "staff") {
    return { ok: false, error: "Use a client or provider workspace to share request files." };
  }

  const parsed = prepareSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid upload." };
  }
  const policyError = documentPolicyError({
    name: parsed.data.name,
    size: parsed.data.size,
    type: parsed.data.type,
  });
  if (policyError) return { ok: false, error: policyError };

  const supabase = await createClient();
  let clientId: string | null = null;
  let folder = "uploads";

  if (profile.user_type === "client") {
    const { data: client } = await supabase.from("clients").select("id").maybeSingle();
    clientId = client?.id ?? null;

    if (parsed.data.requestId) {
      const { data: request } = await supabase
        .from("service_requests")
        .select("id,client_id,status")
        .eq("id", parsed.data.requestId)
        .maybeSingle();
      if (!request || request.client_id !== clientId) {
        return { ok: false, error: "Request not found." };
      }
      if (request.status === "completed" || request.status === "cancelled") {
        return { ok: false, error: "This request no longer accepts files." };
      }
      folder = `requests/${request.id}`;
    }
  } else if (parsed.data.financialsClientId) {
    // The database decides, not this action: can_submit_client_financials is
    // the same gate the write itself re-checks, so an upload can never be
    // authorised for a client the submission would then refuse.
    const { data: allowed } = await supabase.rpc("can_submit_client_financials", {
      p_client_id: parsed.data.financialsClientId,
    });
    if (!allowed) return { ok: false, error: "Customer not found." };
    clientId = parsed.data.financialsClientId;
    folder = "financials";
  } else {
    if (!parsed.data.requestId) {
      return { ok: false, error: "A request is required for provider uploads." };
    }
    const [{ data: provider }, { data: request }] = await Promise.all([
      supabase.from("providers").select("id").maybeSingle(),
      supabase
        .from("service_requests")
        .select("id,client_id,provider_id,status")
        .eq("id", parsed.data.requestId)
        .maybeSingle(),
    ]);
    if (!provider || !request || request.provider_id !== provider.id) {
      return { ok: false, error: "Request not found." };
    }
    if (request.status === "completed" || request.status === "cancelled") {
      return { ok: false, error: "This request no longer accepts files." };
    }
    clientId = request.client_id;
    folder = `requests/${request.id}`;
  }

  if (!clientId) return { ok: false, error: "No client account is linked to this upload." };

  const objectPath = `${clientId}/${folder}/${crypto.randomUUID()}-${safeFilename(parsed.data.name)}`;
  try {
    return { ok: true, upload: await documentStorage.prepareUpload(objectPath) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not authorize the upload.",
    };
  }
}
