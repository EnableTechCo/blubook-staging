import type { Enums } from "@/types/database";

/**
 * A partner's document archive, arranged by customer.
 *
 * A partner used to see one flat list of everything attached to its requests,
 * to be filed by hand. What a partner actually wants to know is "what have we
 * done for this customer" — so the archive is now one folder per customer,
 * holding every document that passed between them in either direction, and
 * inside each folder the documents are grouped by what they are: invoices,
 * the partner's own deliverables, tender packs, orders, and so on.
 *
 * The customer is named the way the requests table names them: the Customer
 * ID for everyone, the business name only where client_references already
 * decided the caller may see it. Nothing here makes an access decision; the
 * rows come in already scoped by RLS to requests assigned to this partner,
 * which is also why a reassigned request's documents leave the folder and a
 * completed one's stay.
 *
 * Pure: the page fetches, this arranges, the tests read it directly.
 */

export type DocumentKind =
  | "invoice"
  | "deliverable"
  | "tender_pack"
  | "order"
  | "compliance"
  | "shared"
  | "issued";

/** Display order and label for each kind. What the partner produced comes first. */
const DOCUMENT_KINDS: { kind: DocumentKind; label: string; description: string }[] = [
  { kind: "invoice", label: "Invoices", description: "Invoices you issued on completed sales orders." },
  { kind: "deliverable", label: "Your deliverables", description: "Files you attached to this customer's requests." },
  { kind: "tender_pack", label: "Tender packs", description: "Tender, RFFA and RFQ documents the customer shared with you." },
  { kind: "order", label: "Orders", description: "Purchase and sales order documents the customer shared with you." },
  { kind: "compliance", label: "Compliance documents", description: "Compliance documents attached to your requests." },
  { kind: "shared", label: "Shared by the customer", description: "Other files the customer attached to your requests." },
  { kind: "issued", label: "Issued by BluBook", description: "Documents BluBook delivered on the customer's behalf." },
];

/** One document as it reaches a partner: the file, the request it rode on, and who it is for. */
export interface PartnerArchiveRow {
  documentId: string;
  title: string;
  category: Enums<"document_category">;
  uploadedBy: string | null;
  createdAt: string;
  request: {
    id: string;
    reference: string;
    requestType: Enums<"request_type">;
    workOrder: string | null;
  };
  clientId: string;
  /** The Customer ID (CUS-…); null only for a row the lookup could not resolve. */
  clientReference: string | null;
  /** The business name where the caller is entitled to it, else null. */
  clientBusinessName: string | null;
}

interface ArchiveDocument {
  id: string;
  title: string;
  kind: DocumentKind;
  createdAt: string;
  from: "you" | "customer" | "bluebook";
  request: PartnerArchiveRow["request"];
}

interface ArchiveGroup {
  kind: DocumentKind;
  label: string;
  description: string;
  documents: ArchiveDocument[];
}

export interface CustomerFolder {
  clientId: string;
  /** What the folder is called: the business name where allowed, else the Customer ID. */
  name: string;
  /** The Customer ID, shown under a business name and used as the fallback name. */
  reference: string | null;
  documentCount: number;
  requestCount: number;
  lastActivity: string;
  groups: ArchiveGroup[];
}

const TENDER_TYPES = new Set<Enums<"request_type">>(["tender_submission", "rffa", "rfq"]);
const ORDER_TYPES = new Set<Enums<"request_type">>(["purchase_order", "sales_order"]);

/**
 * What a document is, from what the platform already knows: its category, the
 * kind of request it rode on, and whether the viewing partner uploaded it.
 * An invoice is the one generated document a partner produces — completing a
 * sales order stores it under the partner's own login — so "generated and
 * mine" is an invoice and "generated and not mine" is something BluBook issued.
 */
export function documentKind(
  row: Pick<PartnerArchiveRow, "category" | "uploadedBy" | "request">,
  viewerProfileId: string,
): DocumentKind {
  const mine = row.uploadedBy === viewerProfileId;
  if (row.category === "generated") return mine ? "invoice" : "issued";
  if (row.category === "compliance") return "compliance";
  if (mine) return "deliverable";
  if (TENDER_TYPES.has(row.request.requestType)) return "tender_pack";
  if (ORDER_TYPES.has(row.request.requestType)) return "order";
  return "shared";
}

function origin(kind: DocumentKind, mine: boolean): ArchiveDocument["from"] {
  if (mine) return "you";
  return kind === "issued" ? "bluebook" : "customer";
}

/**
 * The folders, most recently active first; inside each, the kinds in display
 * order with documents newest first. A document linked to more than one
 * request appears once, under the first link seen.
 */
export function buildPartnerArchive(rows: readonly PartnerArchiveRow[], viewerProfileId: string): CustomerFolder[] {
  const seen = new Set<string>();
  const byClient = new Map<string, { rows: PartnerArchiveRow[]; reference: string | null; name: string | null }>();

  for (const row of rows) {
    if (seen.has(row.documentId)) continue;
    seen.add(row.documentId);
    const entry = byClient.get(row.clientId) ?? { rows: [], reference: null, name: null };
    entry.rows.push(row);
    entry.reference ??= row.clientReference;
    entry.name ??= row.clientBusinessName;
    byClient.set(row.clientId, entry);
  }

  const folders: CustomerFolder[] = [];
  for (const [clientId, entry] of byClient) {
    const documents = entry.rows
      .map((row): ArchiveDocument => {
        const kind = documentKind(row, viewerProfileId);
        return {
          id: row.documentId,
          title: row.title,
          kind,
          createdAt: row.createdAt,
          from: origin(kind, row.uploadedBy === viewerProfileId),
          request: row.request,
        };
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const groups = DOCUMENT_KINDS.map((definition) => ({
      ...definition,
      documents: documents.filter((document) => document.kind === definition.kind),
    })).filter((group) => group.documents.length > 0);

    folders.push({
      clientId,
      name: entry.name ?? entry.reference ?? "Customer",
      reference: entry.reference,
      documentCount: documents.length,
      requestCount: new Set(documents.map((document) => document.request.id)).size,
      lastActivity: documents[0]?.createdAt ?? "",
      groups,
    });
  }

  return folders.sort(
    (left, right) => right.lastActivity.localeCompare(left.lastActivity) || left.name.localeCompare(right.name),
  );
}
