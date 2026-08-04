import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Admin = SupabaseClient<Database>;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ARTWORK_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

// A file input that was left empty still arrives in FormData as a zero-byte
// File, so size is what distinguishes "not provided" from "provided".
export function optionalFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function artworkError(file: File): string | null {
  if (!ARTWORK_TYPES.includes(file.type)) {
    return "Artwork must be a PNG, JPEG, WebP or SVG image.";
  }
  if (file.size > MAX_UPLOAD_BYTES) return "Artwork exceeds the 10MB limit.";
  return null;
}

export function documentError(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) return "The purchase order exceeds the 10MB limit.";
  return null;
}

// The client's profile picture. Public bucket, so the stored path can be
// rendered directly by the browser without minting a signed URL per view.
export async function uploadArtwork(
  admin: Admin,
  clientId: string,
  file: File,
): Promise<string> {
  const path = `${clientId}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await admin.storage
    .from("artwork")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) throw new Error(`Artwork upload failed: ${error.message}`);

  const { error: linkErr } = await admin
    .from("clients")
    .update({ artwork_path: path })
    .eq("id", clientId);
  if (linkErr) {
    await admin.storage.from("artwork").remove([path]);
    throw new Error(`Artwork could not be linked: ${linkErr.message}`);
  }

  return path;
}

// The purchase order supplied at intake. Unlike artwork this is a real record,
// so it goes to the private documents bucket and gets a documents row — which
// is what puts it in the client's archive.
export async function uploadIntakeDocument(
  admin: Admin,
  options: {
    clientId: string;
    uploadedBy: string;
    file: File;
    title: string;
    category: Database["public"]["Enums"]["document_category"];
  },
): Promise<{ documentId: string; path: string }> {
  const path = `${options.clientId}/${crypto.randomUUID()}-${safeName(options.file.name)}`;
  const { error } = await admin.storage
    .from("documents")
    .upload(path, options.file, {
      contentType: options.file.type || "application/octet-stream",
      upsert: false,
    });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data, error: rowErr } = await admin
    .from("documents")
    .insert({
      client_id: options.clientId,
      uploaded_by: options.uploadedBy,
      category: options.category,
      title: options.title,
      storage_path: path,
      mime_type: options.file.type || null,
      size_bytes: options.file.size,
    })
    .select("id")
    .single();

  if (rowErr || !data) {
    await admin.storage.from("documents").remove([path]); // no orphaned object
    throw new Error(rowErr?.message ?? "Could not save the document.");
  }

  return { documentId: data.id, path };
}

// Files a document into an owner's own folder tree, matched by slug. Best
// effort: a missing folder must not fail the intake.
export async function fileIntoFolder(
  admin: Admin,
  options: { documentId: string; ownerProfileId: string; slug: string },
): Promise<void> {
  const { data: folder } = await admin
    .from("document_categories")
    .select("id")
    .eq("owner_profile_id", options.ownerProfileId)
    .eq("slug", options.slug)
    .maybeSingle();
  if (!folder) return;

  await admin.from("document_filings").upsert(
    {
      document_id: options.documentId,
      owner_profile_id: options.ownerProfileId,
      category_id: folder.id,
    },
    { onConflict: "document_id,owner_profile_id" },
  );
}
