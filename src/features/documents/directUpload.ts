"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  PreparedDocumentUpload,
  UploadedDocumentInput,
} from "@/features/documents/uploadPolicy";

export async function uploadDocumentDirectly({
  file,
  prepared,
  onProgress,
}: {
  file: File;
  prepared: PreparedDocumentUpload;
  onProgress?: (percentage: number) => void;
}): Promise<UploadedDocumentInput> {
  onProgress?.(0);
  const { error } = await createClient()
    .storage.from(prepared.bucket)
    .uploadToSignedUrl(prepared.objectPath, prepared.token, file, {
      cacheControl: "3600",
      contentType: file.type,
    });
  if (error) throw new Error(error.message || "Upload failed.");

  onProgress?.(100);
  return {
    locator: prepared.locator,
    title: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}
