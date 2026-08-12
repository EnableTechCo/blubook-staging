"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { requireStaffRole } from "@/services/staffRole";
import { LIBRARY_PREFIX } from "@/features/onboarding/defaultDocuments";
import { MAX_UPLOAD_BYTES, optionalFile } from "@/features/onboarding/intakeUploads";

export type DefaultDocumentState = { error: string } | { ok: true } | undefined;

const schema = z.object({
  name: z.string().trim().min(1, "Name the document").max(200),
  description: z.string().trim().max(2000).optional(),
  targetFolderSlug: z.string().trim().max(80).optional(),
  // Empty means a BluBook document, sent to every client.
  workGroupId: z.string().uuid().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

// Staff add a document to the library that every new client receives. The file
// is stored once under a library prefix; onboarding copies it per client.
export async function addDefaultDocument(
  _prev: DefaultDocumentState,
  formData: FormData,
): Promise<DefaultDocumentState> {
  const staff = await getCurrentProfile();
  // The insert below runs through the admin client, so RLS never sees it and
  // this check is the only one there is.
  const denied = await requireStaffRole("operations");
  if (denied || !staff) return { error: denied ?? "Not authenticated." };

  const file = optionalFile(formData.get("file"));
  if (!file) return { error: "Choose a file to add." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "The file exceeds the 10MB limit." };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    targetFolderSlug: formData.get("targetFolderSlug") || undefined,
    workGroupId: formData.get("workGroupId") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const admin = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${LIBRARY_PREFIX}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadErr } = await admin.storage
    .from("documents")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadErr) return { error: uploadErr.message };

  const { error: rowErr } = await admin.from("default_documents").insert({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    storage_path: path,
    mime_type: file.type || null,
    size_bytes: file.size,
    target_folder_slug: parsed.data.targetFolderSlug ?? null,
    work_group_id: parsed.data.workGroupId ?? null,
    sort_order: parsed.data.sortOrder,
    created_by: staff.id,
  });
  if (rowErr) {
    await admin.storage.from("documents").remove([path]); // no orphaned object
    return { error: rowErr.message };
  }

  revalidatePath("/dashboard/default-documents");
  return { ok: true };
}

// Retire or restore a template. Retiring never touches documents already
// delivered — those are the clients' own copies.
export async function setDefaultDocumentActive(formData: FormData): Promise<void> {
  const staff = await getCurrentProfile();
  if (await requireStaffRole("operations")) return;

  const parsed = z
    .object({ id: z.string().uuid(), active: z.enum(["true", "false"]) })
    .safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("default_documents")
    .update({ active: parsed.data.active === "true" })
    .eq("id", parsed.data.id);

  revalidatePath("/dashboard/default-documents");
}
