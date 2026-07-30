import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { documentObjectPath, documentStorage } from "@/lib/storage/documents";
import {
  documentPolicyError,
  MAX_DOCUMENTS_PER_SUBMISSION,
  type UploadedDocumentInput,
} from "@/features/documents/uploadPolicy";

export async function removeUploadedDocuments(files: UploadedDocumentInput[]): Promise<void> {
  await Promise.allSettled(files.map((file) => documentStorage.deleteObject(file.locator)));
}
export async function persistRequestDocuments({
  clientId,
  files,
  profileId,
  requestId,
}: {
  clientId: string;
  files: UploadedDocumentInput[];
  profileId: string;
  requestId: string;
}): Promise<{ error: string | null }> {
  if (files.length === 0 || files.length > MAX_DOCUMENTS_PER_SUBMISSION) {
    return { error: `Attach between 1 and ${MAX_DOCUMENTS_PER_SUBMISSION} files.` };
  }

  const verified: Array<{
    locator: string;
    mimeType: string;
    sizeBytes: number;
    title: string;
  }> = [];

  try {
    for (const file of files) {
      const policyError = documentPolicyError({
        name: file.title,
        size: file.sizeBytes,
        type: file.mimeType,
      });
      if (policyError) throw new Error(policyError);

      const objectPath = documentObjectPath(file.locator);
      if (!objectPath.startsWith(`${clientId}/`)) {
        throw new Error("An uploaded file does not belong to this client.");
      }

      const object = await documentStorage.verifyUpload(file.locator);
      const contentType = (object.contentType ?? file.mimeType).split(";")[0].trim();
      const verifiedPolicyError = documentPolicyError({
        name: file.title,
        size: object.size,
        type: contentType,
      });
      if (verifiedPolicyError) throw new Error(verifiedPolicyError);
      if (object.size !== file.sizeBytes) {
        throw new Error(`The uploaded size for ${file.title} could not be verified.`);
      }

      verified.push({
        locator: object.locator,
        mimeType: contentType,
        sizeBytes: object.size,
        title: file.title,
      });
    }
  } catch (error) {
    await removeUploadedDocuments(files);
    return {
      error: error instanceof Error ? error.message : "Could not verify the uploaded files.",
    };
  }

  const admin = createAdminClient();
  const { data: documents, error: documentError } = await admin
    .from("documents")
    .insert(
      verified.map((file) => ({
        category: "other" as const,
        client_id: clientId,
        mime_type: file.mimeType,
        size_bytes: file.sizeBytes,
        storage_path: file.locator,
        title: file.title,
        uploaded_by: profileId,
      })),
    )
    .select("id");

  if (documentError || !documents || documents.length !== verified.length) {
    await removeUploadedDocuments(files);
    return { error: documentError?.message ?? "Could not save the document records." };
  }

  const { error: linkError } = await admin.from("request_documents").insert(
    documents.map((document) => ({
      document_id: document.id,
      request_id: requestId,
    })),
  );
  if (linkError) {
    await admin
      .from("documents")
      .delete()
      .in(
        "id",
        documents.map((document) => document.id),
      );
    await removeUploadedDocuments(files);
    return { error: linkError.message };
  }

  return { error: null };
}
