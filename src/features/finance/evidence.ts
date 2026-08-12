import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUploadedDocuments, removeUploadedDocuments } from "@/features/documents/requestAttachments";
import type { UploadedDocumentInput } from "@/features/documents/uploadPolicy";

const EVIDENCE_FOLDER_SLUG = "finance";

/**
 * Files one supporting document for a week of figures.
 *
 * The document is stored once and filed twice: into the client's archive,
 * where it is their record, and into the submitting partner's own library,
 * where it is their proof of what they reported. Two filings rather than two
 * uploads — a second copy of the bytes would be a second thing to keep in step,
 * and the two would eventually disagree.
 *
 * Both parties land in their Finance folder where they have one, since that is
 * where a reader would look for it.
 */
export async function fileFinancialEvidence({
  clientId,
  clientProfileId,
  partnerProfileId,
  file,
  title,
}: {
  clientId: string;
  clientProfileId: string | null;
  partnerProfileId: string;
  file: UploadedDocumentInput;
  title: string;
}): Promise<{ documentId: string | null; error: string | null }> {
  const verification = await verifyUploadedDocuments({ clientId, files: [file] });
  if (verification.error) return { documentId: null, error: verification.error };
  const verified = verification.documents[0]!;

  const admin = createAdminClient();
  const { data: document, error } = await admin
    .from("documents")
    .insert({
      category: "other" as const,
      client_id: clientId,
      mime_type: verified.mimeType,
      size_bytes: verified.sizeBytes,
      storage_path: verified.locator,
      title,
      uploaded_by: partnerProfileId,
    })
    .select("id")
    .single();

  if (error || !document) {
    await removeUploadedDocuments([file]);
    return { documentId: null, error: error?.message ?? "Could not save the document." };
  }

  // Folder trees are per owner, so the Finance folder has to be looked up for
  // each party. A filing needs a folder, so a party without one is skipped
  // rather than filed nowhere: the document still exists and the other party
  // still gets their copy.
  const owners = [clientProfileId, partnerProfileId].filter(
    (owner): owner is string => owner !== null,
  );
  const { data: folders } = await admin
    .from("document_categories")
    .select("id,owner_profile_id")
    .eq("slug", EVIDENCE_FOLDER_SLUG)
    .in("owner_profile_id", owners);

  const filings = (folders ?? [])
    .filter((folder): folder is { id: string; owner_profile_id: string } =>
      folder.owner_profile_id !== null,
    )
    .map((folder) => ({
      document_id: document.id,
      owner_profile_id: folder.owner_profile_id,
      category_id: folder.id,
    }));

  if (filings.length > 0) {
    const { error: filingError } = await admin.from("document_filings").insert(filings);
    if (filingError) {
      await admin.from("documents").delete().eq("id", document.id);
      await removeUploadedDocuments([file]);
      return { documentId: null, error: filingError.message };
    }
  }

  return { documentId: document.id, error: null };
}
