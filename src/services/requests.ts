import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

/**
 * The service-request read model.
 *
 * This is the hub the old dashboard module was built around: twelve files
 * import RequestRow and nothing else, and every per-role dashboard lists
 * requests through the same select and the same reference merge. It lives
 * here on its own so that changing how a request is read is a change to one
 * concern, not to a file that also happened to own notifications.
 *
 * Shapes are asserted with .returns<>() so embedded-select results stay
 * strongly typed without hand-joining.
 */

type RequestStatus = Enums<"request_status">;

export const requestRowSelect =
  "id,reference,title,description,status,origin,request_type,partner_work_order_reference,sales_opportunity_id,source_request_id,created_at,updated_at,completed_at,client_id,provider_id,services(name,service_groups(name)),providers(business_name),clients(business_name,external_reference),sales_opportunities(deal_reference,opportunity_name,revenue,currency,fiscal_year,fiscal_quarter,fiscal_week,invoice_number,payment_status,booked_at,paid_at,updated_at),request_assignments(id,status),request_schedules(due_at,eta_type,sla_started_at,sla_target_business_days),request_events(to_status,created_at),request_messages(id,body,created_at)" as const;

export interface RequestRow {
  id: string;
  reference: string;
  title: string;
  description?: string | null;
  status: RequestStatus;
  origin: Enums<"request_origin">;
  request_type?: string;
  partner_work_order_reference?: string | null;
  sales_opportunity_id?: string | null;
  source_request_id?: string | null;
  sales_opportunities?: {
    deal_reference: string;
    opportunity_name: string;
    revenue: number;
    currency: string;
    fiscal_year: number | null;
    fiscal_quarter: number | null;
    fiscal_week: number | null;
    invoice_number: string | null;
    payment_status: Enums<"opportunity_payment_status"> | null;
    booked_at: string | null;
    paid_at: string | null;
    updated_at: string;
  } | null;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  // Ids are always readable by a party to the request, and let the UI show an
  // anonymised counterparty (assigned-or-not / a pseudonym) without exposing
  // the other side's identity. Client and provider are anonymous to each other.
  client_id: string;
  // The client's Customer ID (CUS-…), the one identifier every role uses.
  // Read through client_references, which projects only the safe columns, so a
  // partner can identify a client without being able to reach their details.
  client_reference?: string | null;
  // The client's business name, from the same lookup. Null for everyone the
  // anonymity rule still covers — the view withholds it rather than the query
  // omitting it, so a standard partner cannot ask for it by other means.
  client_business_name?: string | null;
  provider_id: string | null;
  services: {
    name: string;
    service_groups?: { name: string } | null;
  } | null;
  // Embedded names resolve only for staff (the intermediary); RLS returns null
  // for the counterparty, preserving anonymity.
  providers: { business_name: string } | null;
  clients: {
    business_name: string;
    external_reference?: string | null;
  } | null;
  request_assignments?: {
    id: string;
    status: Enums<"assignment_status">;
  }[];
  // request_schedules is 1:1 with service_requests, so it embeds as an object.
  request_schedules: {
    due_at: string | null;
    eta_type: Enums<"eta_type">;
    sla_started_at?: string;
    sla_target_business_days?: number | null;
  } | null;
  request_events?: {
    to_status: RequestStatus;
    created_at: string;
  }[];
  request_messages?: {
    id: string;
    body: string;
    created_at: string;
  }[];
}

// Attaches each row's Customer ID, and the business name where the caller is
// entitled to it. It comes from a separate lookup rather than an embed because
// clients_select does not admit partners: embedding through clients would
// return null for exactly the role that needs it most.
//
// The business name is asked for unconditionally. Deciding entitlement here
// would put the anonymity rule in the query layer, where a future caller could
// forget it; client_references answers with null instead, so the rule holds
// however the data is fetched.
export async function withClientReferences<T extends { client_id: string }>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: T[],
): Promise<(T & { client_reference: string | null; client_business_name: string | null })[]> {
  const ids = [...new Set(rows.map((row) => row.client_id))];
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("client_references")
    .select("id,external_reference,business_name")
    .in("id", ids)
    .returns<{ id: string; external_reference: string | null; business_name: string | null }[]>();

  const byId = new Map((data ?? []).map((row) => [row.id, row]));
  return rows.map((row) => ({
    ...row,
    client_reference: byId.get(row.client_id)?.external_reference ?? null,
    client_business_name: byId.get(row.client_id)?.business_name ?? null,
  }));
}

interface RequestDocument {
  id: string;
  title: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  uploaded_by: string | null;
}

interface RequestDetail extends RequestRow {
  request_documents: {
    created_at: string;
    documents: RequestDocument | null;
  }[];
}

export async function getRequestDetail(requestId: string): Promise<RequestDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_requests")
    .select(
      `${requestRowSelect},request_documents(created_at,documents(id,title,mime_type,size_bytes,created_at,uploaded_by))`,
    )
    .eq("id", requestId)
    .maybeSingle<RequestDetail>();
  if (!data) return null;

  if (data.sales_opportunity_id && !data.sales_opportunities) {
    const { data: linkedOpportunity } = await supabase.rpc(
      "get_linked_opportunity_for_request",
      { p_request_id: data.id },
    );
    data.sales_opportunities = linkedOpportunity?.[0] ?? null;
  }

  const [withReference] = await withClientReferences(supabase, [data]);
  return withReference;
}
