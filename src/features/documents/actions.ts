"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/services/profiles";

export type UploadState = { error: string } | { ok: true } | undefined;

const schema = z.object({
  title: z.string().trim().min(1, "A title is required").max(200),
  // Where the document came from.
  category: z.enum(["compliance", "generated", "other"]),
  // Where it is filed in the archive taxonomy.
  categoryId: z.string().uuid().optional(),
  documentTypeId: z.string().uuid().optional(),
  onboardingDocumentId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  expiresAt: z.string().optional(),
});

const orUndef = (v: FormDataEntryValue | null) => (v ? String(v) : undefined);

// Client or staff uploads a document. File bytes go to the private bucket via
// the admin client; the metadata row is written with the resolved client owner.
// If it satisfies an onboarding checklist item, that item is marked received.
export async function uploadDocument(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Not authenticated" };
  const isStaff = profile.user_type === "staff";
  if (!isStaff && profile.user_type !== "client") return { error: "Not authorized to upload" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload" };
  if (file.size > 10 * 1024 * 1024) return { error: "File exceeds the 10MB limit" };

  const parsed = schema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    categoryId: orUndef(formData.get("categoryId")),
    documentTypeId: orUndef(formData.get("documentTypeId")),
    onboardingDocumentId: orUndef(formData.get("onboardingDocumentId")),
    clientId: orUndef(formData.get("clientId")),
    expiresAt: orUndef(formData.get("expiresAt")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const input = parsed.data;

  // Resolve the owning client: a client uploads to their own account; staff must
  // name the client.
  const supabase = await createClient();
  let clientId = input.clientId;
  if (!isStaff) {
    const { data: own } = await supabase.from("clients").select("id").maybeSingle();
    if (!own) return { error: "No client account is linked to your profile" };
    clientId = own.id;
  }
  if (!clientId) return { error: "A client must be specified" };

  const admin = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${clientId}/${crypto.randomUUID()}-${safeName}`;

  const uploaded = await admin.storage
    .from("documents")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploaded.error) return { error: uploaded.error.message };

  const { data: doc, error: insertErr } = await admin
    .from("documents")
    .insert({
      client_id: clientId,
      uploaded_by: profile.id,
      category: input.category,
      category_id: input.categoryId ?? null,
      document_type_id: input.documentTypeId ?? null,
      onboarding_document_id: input.onboardingDocumentId ?? null,
      title: input.title,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      expires_at: input.expiresAt || null,
    })
    .select("id")
    .single();

  if (insertErr || !doc) {
    await admin.storage.from("documents").remove([path]); // roll back the orphaned file
    return { error: insertErr?.message ?? "Failed to save the document" };
  }

  // Uploading against a checklist item marks it received.
  if (input.onboardingDocumentId) {
    await admin.from("onboarding_documents").update({ status: "received" }).eq("id", input.onboardingDocumentId);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/onboardings");
  return { ok: true };
}
