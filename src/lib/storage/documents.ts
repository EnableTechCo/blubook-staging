import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PreparedDocumentUpload } from "@/features/documents/uploadPolicy";

const DOCUMENT_BUCKET = "documents";
const LOCATOR_PREFIX = `supabase://${DOCUMENT_BUCKET}/`;

export interface VerifiedDocumentObject {
  contentType: string | null;
  locator: string;
  objectPath: string;
  size: number;
}

export interface DocumentStorage {
  prepareUpload(objectPath: string): Promise<PreparedDocumentUpload>;
  verifyUpload(locator: string): Promise<VerifiedDocumentObject>;
  createDownloadUrl(locator: string, expiresInSeconds: number): Promise<string>;
  deleteObject(locator: string): Promise<void>;
}

export function documentLocator(objectPath: string): string {
  return `${LOCATOR_PREFIX}${objectPath}`;
}

export function documentObjectPath(locator: string): string {
  if (locator.startsWith(LOCATOR_PREFIX)) return locator.slice(LOCATOR_PREFIX.length);
  // Existing rows predate provider-aware locators and contain a plain bucket path.
  return locator;
}

export const documentStorage: DocumentStorage = {
  async prepareUpload(objectPath) {
    const { data, error } = await createAdminClient()
      .storage.from(DOCUMENT_BUCKET)
      .createSignedUploadUrl(objectPath, { upsert: false });
    if (error || !data) throw new Error(error?.message ?? "Could not authorize the upload.");

    return {
      bucket: DOCUMENT_BUCKET,
      locator: documentLocator(objectPath),
      objectPath,
      token: data.token,
    };
  },

  async verifyUpload(locator) {
    const objectPath = documentObjectPath(locator);
    const { data, error } = await createAdminClient()
      .storage.from(DOCUMENT_BUCKET)
      .info(objectPath);
    if (error || !data) throw new Error(error?.message ?? "Uploaded file was not found.");

    return {
      contentType: data.contentType ?? null,
      locator: documentLocator(objectPath),
      objectPath,
      size: data.size ?? 0,
    };
  },

  async createDownloadUrl(locator, expiresInSeconds) {
    const { data, error } = await createAdminClient()
      .storage.from(DOCUMENT_BUCKET)
      .createSignedUrl(documentObjectPath(locator), expiresInSeconds);
    if (error || !data) throw new Error(error?.message ?? "Document is unavailable.");
    return data.signedUrl;
  },

  async deleteObject(locator) {
    const { error } = await createAdminClient()
      .storage.from(DOCUMENT_BUCKET)
      .remove([documentObjectPath(locator)]);
    if (error) throw new Error(error.message);
  },
};
