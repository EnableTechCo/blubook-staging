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

export interface VerifiedUploadedDocument {
  locator: string;
  mimeType: string;
  sizeBytes: number;
  title: string;
}

export async function verifyUploadedDocuments({
  clientId,
  files,
}: {
  clientId: string;
  files: UploadedDocumentInput[];
}): Promise<{ documents: VerifiedUploadedDocument[]; error: string | null }> {
  if (files.length === 0 || files.length > MAX_DOCUMENTS_PER_SUBMISSION) {
    return { documents: [], error: `Attach between 1 and ${MAX_DOCUMENTS_PER_SUBMISSION} files.` };
  }

  const verified: VerifiedUploadedDocument[] = [];
  try {
    for (const file of files) {
      const policyError = documentPolicyError({ name: file.title, size: file.sizeBytes, type: file.mimeType });
      if (policyError) throw new Error(policyError);
      const objectPath = documentObjectPath(file.locator);
      if (!objectPath.startsWith(`${clientId}/`)) throw new Error("An uploaded file does not belong to this client.");
      const object = await documentStorage.verifyUpload(file.locator);
      const contentType = (object.contentType ?? file.mimeType).split(";")[0].trim();
      const verifiedPolicyError = documentPolicyError({ name: file.title, size: object.size, type: contentType });
      if (verifiedPolicyError) throw new Error(verifiedPolicyError);
      if (object.size !== file.sizeBytes) throw new Error(`The uploaded size for ${file.title} could not be verified.`);
      verified.push({ locator: object.locator, mimeType: contentType, sizeBytes: object.size, title: file.title });
    }
    return { documents: verified, error: null };
  } catch (error) {
    await removeUploadedDocuments(files);
    return { documents: [], error: error instanceof Error ? error.message : "Could not verify the uploaded files." };
  }
}
export async function persistRequestDocuments({
  categoryId,
  clientId,
  files,
  profileId,
  requestId,
}: {
  categoryId?: string | null;
  clientId: string;
  files: UploadedDocumentInput[];
  profileId: string;
  requestId: string;
}): Promise<{ error: string | null }> {
  const verification = await verifyUploadedDocuments({ clientId, files });
  if (verification.error) return { error: verification.error };
  const verified = verification.documents;

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

  if (categoryId) {
    const { error: filingError } = await admin.from("document_filings").insert(
      documents.map((document) => ({
        category_id: categoryId,
        document_id: document.id,
        owner_profile_id: profileId,
      })),
    );
    if (filingError) {
      await admin
        .from("documents")
        .delete()
        .in(
          "id",
          documents.map((document) => document.id),
        );
      await removeUploadedDocuments(files);
      return { error: filingError.message };
    }
  }

  return { error: null };
}
