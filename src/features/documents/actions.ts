"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/services/profiles";

export type UploadState = { error: string } | { ok: true } | undefined;

const schema = z.object({
  title: z.string().trim().min(1, "A title is required").max(200),
  // Where the document came from.
  category: z.enum(["compliance", "generated", "other"]),
  // Where the uploader files it in their own tree (a document_categories id).
  folderId: z.string().uuid().optional(),
  documentTypeId: z.string().uuid().optional(),
  onboardingDocumentId: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  expiresAt: z.string().optional(),
});

const orUndef = (v: FormDataEntryValue | null) => (v ? String(v) : undefined);

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `folder-${crypto.randomUUID().slice(0, 8)}`
  );
}

// Client or staff uploads a document. File bytes go to the private bucket via
// the admin client; the metadata row is written with the resolved client owner.
// If it satisfies an onboarding checklist item, that item is marked received. A
// folder chosen by the uploader is recorded as a filing in their own tree.
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
    folderId: orUndef(formData.get("folderId")),
    documentTypeId: orUndef(formData.get("documentTypeId")),
    onboardingDocumentId: orUndef(formData.get("onboardingDocumentId")),
    requestId: orUndef(formData.get("requestId")),
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
  let resolvedDocumentTypeId = input.documentTypeId;
  if (!isStaff && input.requestId && !input.onboardingDocumentId) {
    return { error: "This request does not accept this upload" };
  }
  if (!isStaff && input.onboardingDocumentId) {
    const { data: checklistItem } = await admin
      .from("onboarding_documents")
      .select(
        "id,document_type_id,onboardings!inner(client_id,compliance_request_id)",
      )
      .eq("id", input.onboardingDocumentId)
      .maybeSingle<{
        id: string;
        document_type_id: string;
        onboardings: { client_id: string; compliance_request_id: string | null };
      }>();
    if (
      !checklistItem ||
      checklistItem.onboardings.client_id !== clientId ||
      !input.requestId ||
      checklistItem.onboardings.compliance_request_id !== input.requestId ||
      (input.documentTypeId && input.documentTypeId !== checklistItem.document_type_id)
    ) {
      return { error: "This checklist item is not available for your account" };
    }
    resolvedDocumentTypeId = checklistItem.document_type_id;
  }

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
      category: input.onboardingDocumentId ? "compliance" : input.category,
      document_type_id: resolvedDocumentTypeId ?? null,
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

  if (input.requestId) {
    const { error: linkError } = await admin.from("request_documents").insert({
      request_id: input.requestId,
      document_id: doc.id,
    });
    if (linkError) {
      await admin.from("documents").delete().eq("id", doc.id);
      await admin.storage.from("documents").remove([path]);
      return { error: linkError.message };
    }
  }

  // File it in the uploader's own tree. Insert under the user's session so RLS
  // confirms the folder is theirs; staff have no folders, so this is skipped.
  if (input.folderId && !isStaff) {
    await supabase
      .from("document_filings")
      .upsert(
        { document_id: doc.id, owner_profile_id: profile.id, category_id: input.folderId },
        { onConflict: "document_id,owner_profile_id" },
      );
  }

  // Uploading against a checklist item marks it received.
  if (input.onboardingDocumentId) {
    await admin.from("onboarding_documents").update({ status: "received" }).eq("id", input.onboardingDocumentId);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/onboardings");
  if (input.requestId) {
    revalidatePath(`/dashboard/messages/${input.requestId}`);
    revalidatePath(`/dashboard/reports/requests/${input.requestId}`);
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Folder management — a client or partner curates their own tree
// ---------------------------------------------------------------------------

const folderNameSchema = z.string().trim().min(1, "Name the folder").max(80);

async function ownerOnly() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  if (profile.user_type !== "client" && profile.user_type !== "service_provider") return null;
  return profile;
}

// Create a folder, optionally under a parent (one level deep only).
export async function createFolder(formData: FormData): Promise<void> {
  const profile = await ownerOnly();
  if (!profile) return;

  const parsed = z
    .object({
      name: folderNameSchema,
      parentId: z.string().uuid().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      parentId: orUndef(formData.get("parentId")),
    });
  if (!parsed.success) return;

  const supabase = await createClient();

  // Keep the tree two levels deep: a folder under a subfolder is not allowed.
  if (parsed.data.parentId) {
    const { data: parent } = await supabase
      .from("document_categories")
      .select("parent_id")
      .eq("id", parsed.data.parentId)
      .maybeSingle();
    if (!parent || parent.parent_id) return;
  }

  // Unique slug within the owner's tree.
  const base = slugify(parsed.data.name);
  const { data: existing } = await supabase
    .from("document_categories")
    .select("slug")
    .eq("owner_profile_id", profile.id)
    .like("slug", `${base}%`);
  const taken = new Set((existing ?? []).map((r) => r.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;

  await supabase.from("document_categories").insert({
    owner_profile_id: profile.id,
    parent_id: parsed.data.parentId ?? null,
    name: parsed.data.name,
    slug,
  });

  revalidatePath("/dashboard/documents");
}

export async function renameFolder(formData: FormData): Promise<void> {
  const profile = await ownerOnly();
  if (!profile) return;

  const parsed = z
    .object({ folderId: z.string().uuid(), name: folderNameSchema })
    .safeParse({ folderId: formData.get("folderId"), name: formData.get("name") });
  if (!parsed.success) return;

  // RLS restricts the update to the caller's own folders.
  const supabase = await createClient();
  await supabase
    .from("document_categories")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.folderId);

  revalidatePath("/dashboard/documents");
}

// Delete a folder. Refused while it still holds subfolders or filed documents,
// so nothing is removed by surprise.
export async function deleteFolder(formData: FormData): Promise<void> {
  const profile = await ownerOnly();
  if (!profile) return;

  const parsed = z.object({ folderId: z.string().uuid() }).safeParse({
    folderId: formData.get("folderId"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const [{ count: children }, { count: filed }] = await Promise.all([
    supabase
      .from("document_categories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", parsed.data.folderId),
    supabase
      .from("document_filings")
      .select("document_id", { count: "exact", head: true })
      .eq("category_id", parsed.data.folderId),
  ]);
  if ((children ?? 0) > 0 || (filed ?? 0) > 0) {
    redirect(
      `/dashboard/documents?error=${encodeURIComponent("Empty the folder before deleting it.")}`,
    );
  }

  await supabase.from("document_categories").delete().eq("id", parsed.data.folderId);
  revalidatePath("/dashboard/documents");
}

// Move a document into a folder, or out of every folder (unfile) when no folder
// is given. Scoped to the caller's own tree.
export async function fileDocument(formData: FormData): Promise<void> {
  const profile = await ownerOnly();
  if (!profile) return;

  const parsed = z
    .object({
      documentId: z.string().uuid(),
      folderId: z.union([z.string().uuid(), z.literal("")]).optional(),
    })
    .safeParse({
      documentId: formData.get("documentId"),
      folderId: orUndef(formData.get("folderId")) ?? "",
    });
  if (!parsed.success) return;

  const supabase = await createClient();
  if (parsed.data.folderId) {
    await supabase.from("document_filings").upsert(
      {
        document_id: parsed.data.documentId,
        owner_profile_id: profile.id,
        category_id: parsed.data.folderId,
      },
      { onConflict: "document_id,owner_profile_id" },
    );
  } else {
    await supabase
      .from("document_filings")
      .delete()
      .eq("document_id", parsed.data.documentId)
      .eq("owner_profile_id", profile.id);
  }

  revalidatePath("/dashboard/documents");
}
