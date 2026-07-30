"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { documentObjectPath, documentStorage } from "@/lib/storage/documents";
import { getCurrentProfile } from "@/services/profiles";
import { documentPolicyError } from "@/features/documents/uploadPolicy";

const schema = z.object({
  category: z.enum(["compliance", "generated", "other"]),
  categoryId: z.string().uuid().optional(),
  expiresAt: z.string().max(40).optional(),
  file: z.object({
    locator: z.string().trim().min(1).max(1000),
    title: z.string().trim().min(1).max(240),
    mimeType: z.string().trim().min(1).max(160),
    sizeBytes: z.number().int().positive(),
  }),
  title: z.string().trim().min(1).max(200),
});

export type FinalizeArchiveResult = { ok: true } | { ok: false; error: string };

export async function finalizeDirectArchiveDocument(
  input: unknown,
): Promise<FinalizeArchiveResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not authenticated." };
  if (profile.user_type !== "client") {
    return { ok: false, error: "Only clients can use direct archive upload." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid document." };
  }

  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("id").maybeSingle();
  if (!client) return { ok: false, error: "No client account is linked to your profile." };

  const objectPath = documentObjectPath(parsed.data.file.locator);
  if (!objectPath.startsWith(`${client.id}/`)) {
    return { ok: false, error: "The uploaded file does not belong to this client." };
  }

  try {
    const object = await documentStorage.verifyUpload(parsed.data.file.locator);
    const mimeType = (object.contentType ?? parsed.data.file.mimeType).split(";")[0].trim();
    const policyError = documentPolicyError({
      name: parsed.data.file.title,
      size: object.size,
      type: mimeType,
    });
    if (policyError) throw new Error(policyError);
    if (object.size !== parsed.data.file.sizeBytes) {
      throw new Error("The uploaded file size could not be verified.");
    }

    const { error } = await createAdminClient().from("documents").insert({
      category: parsed.data.category,
      category_id: parsed.data.categoryId ?? null,
      client_id: client.id,
      expires_at: parsed.data.expiresAt || null,
      mime_type: mimeType,
      size_bytes: object.size,
      storage_path: object.locator,
      title: parsed.data.title,
      uploaded_by: profile.id,
    });
    if (error) throw new Error(error.message);
  } catch (error) {
    await documentStorage.deleteObject(parsed.data.file.locator).catch(() => undefined);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save the document.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  return { ok: true };
}
