import "server-only";
import { createClient } from "@/lib/supabase/server";
import { withClientReferences } from "@/services/requests";
import type { PartnerArchiveRow } from "@/features/documents/partnerArchive";
import type { Enums } from "@/types/database";

/**
 * Every document attached to a request the calling partner holds, with the
 * request it rode on and the customer it belongs to.
 *
 * Read under the caller's session on purpose. request_documents and documents
 * are both RLS-scoped to requests assigned to this partner, so a request that
 * staff move to another partner drops out here without any decision of ours,
 * and a completed one stays because it is still theirs. The customer's name
 * comes through client_references, which answers with the business name only
 * for callers entitled to it and null for everyone else.
 */

interface LinkRow {
  documents: {
    id: string;
    title: string;
    category: Enums<"document_category">;
    uploaded_by: string | null;
    created_at: string;
  } | null;
  service_requests: {
    id: string;
    reference: string;
    request_type: Enums<"request_type">;
    partner_work_order_reference: string | null;
    client_id: string;
  } | null;
}

export async function getPartnerArchiveRows(): Promise<PartnerArchiveRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("request_documents")
    .select(
      "documents(id,title,category,uploaded_by,created_at),service_requests(id,reference,request_type,partner_work_order_reference,client_id)",
    )
    .returns<LinkRow[]>();

  const linked = (data ?? []).flatMap((link) =>
    link.documents && link.service_requests ? [{ document: link.documents, request: link.service_requests }] : [],
  );
  if (linked.length === 0) return [];

  const withRefs = await withClientReferences(
    supabase,
    linked.map((entry) => ({ ...entry, client_id: entry.request.client_id })),
  );

  return withRefs.map((entry) => ({
    documentId: entry.document.id,
    title: entry.document.title,
    category: entry.document.category,
    uploadedBy: entry.document.uploaded_by,
    createdAt: entry.document.created_at,
    request: {
      id: entry.request.id,
      reference: entry.request.reference,
      requestType: entry.request.request_type,
      workOrder: entry.request.partner_work_order_reference,
    },
    clientId: entry.request.client_id,
    clientReference: entry.client_reference,
    clientBusinessName: entry.client_business_name,
  }));
}
