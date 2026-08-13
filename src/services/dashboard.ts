import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  onboardingMatchesStage,
  type OnboardingQueueStage,
} from "@/services/onboardingFilters";
import type { Enums } from "@/types/database";

// View models for the dashboards. Shapes are asserted with .returns<>() so the
// embedded-select results stay strongly typed without hand-joining.

type RequestStatus = Enums<"request_status">;
type ServiceTier = Enums<"service_tier">;

const requestRowSelect =
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
async function withClientReferences<T extends { client_id: string }>(
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

export interface RequestDocument {
  id: string;
  title: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  uploaded_by: string | null;
}

export interface RequestDetail extends RequestRow {
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

export interface ClientDashboardData {
  client: {
    id: string;
    business_name: string;
    status: Enums<"client_status">;
    artwork_path: string | null;
  } | null;
  packages: {
    id: string;
    name: string;
    type: Enums<"package_type">;
    tier: ServiceTier | null;
    total_price: number;
    status: Enums<"client_package_status">;
    client_package_line_items: { name: string; tier: ServiceTier; unit_price: number; quantity: number }[];
  }[];
  requests: RequestRow[];
}

export interface DocumentRow {
  id: string;
  title: string;
  category: Enums<"document_category">;
  expires_at: string | null;
  created_at: string;
  // Where the current owner has filed this document in their own tree (null =
  // unfiled). Populated from document_filings scoped to the caller.
  folder_id: string | null;
}

export interface DocumentFolder {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  sort_order: number;
}

// The caller's own folder tree, parents ordered first with their children.
export async function getDocumentFolders(): Promise<DocumentFolder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("document_categories")
    .select("id,parent_id,slug,name,sort_order")
    .eq("active", true)
    .order("sort_order")
    .returns<DocumentFolder[]>();
  return data ?? [];
}

export interface NotificationRow {
  id: string;
  type: Enums<"notification_type">;
  /** Urgent notifications lead the page and are the only ones the bell counts. */
  urgent: boolean;
  title: string;
  body: string | null;
  request_id: string | null;
  document_id: string | null;
  read_at: string | null;
  created_at: string;
}

// The caller's notifications (RLS-scoped to recipient), newest first.
export async function getNotifications(): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id,type,urgent,title,body,request_id,document_id,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<NotificationRow[]>();
  return data ?? [];
}

/**
 * What the bell counts.
 *
 * Urgent only, deliberately. Overdue requests still raise notifications and
 * still appear on the notifications page — they just do not ring the bell,
 * because a bell that lights up for every late request stops meaning anything.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("urgent", true)
    .is("read_at", null);
  return count ?? 0;
}

export interface MessageThread {
  id: string;
  reference: string;
  title: string;
  status: Enums<"request_status">;
  request_messages: {
    id: string;
    body: string;
    sender_role: Enums<"message_sender_role">;
    sender_id: string | null;
    created_at: string;
  }[];
}

export interface ComplianceRequestChecklist {
  id: string;
  client_id: string;
  onboarding_documents: {
    id: string;
    document_type_id: string;
    status: Enums<"compliance_status">;
    compliance_document_types: { name: string } | null;
    documents: {
      id: string;
      title: string;
      created_at: string;
    }[];
  }[];
}

// Conversations the caller can take part in, each with its messages. RLS scopes
// the requests (client's own / provider's assigned / staff all).
//
// A thread qualifies when it has an assigned provider — so a counterpart exists
// to talk to — or when someone has already posted to it. The second case covers
// requests BluBook raises and answers itself, such as the onboarding welcome,
// which has no partner but is a real conversation.
export async function getMessagingThreads(): Promise<MessageThread[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_requests")
    .select(
      "id,reference,title,status,provider_id,request_messages(id,body,sender_role,sender_id,created_at)",
    )
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<(MessageThread & { provider_id: string | null })[]>();

  return (data ?? [])
    .filter((thread) => thread.provider_id !== null || thread.request_messages.length > 0)
    .map(({ provider_id: _providerId, ...thread }) => thread);
}

export interface ThreadSummary {
  id: string;
  reference: string;
  title: string;
  status: Enums<"request_status">;
  messageCount: number;
  lastMessage: MessageThread["request_messages"][number] | null;
}

// Inbox view: one row per conversation with its latest message, newest activity
// first (threads with no messages fall to the bottom).
export async function getThreadSummaries(): Promise<ThreadSummary[]> {
  const threads = await getMessagingThreads();

  return threads
    .map((t) => {
      const ordered = [...t.request_messages].sort((a, b) =>
        a.created_at.localeCompare(b.created_at),
      );
      return {
        id: t.id,
        reference: t.reference,
        title: t.title,
        status: t.status,
        messageCount: ordered.length,
        lastMessage: ordered.at(-1) ?? null,
      };
    })
    .sort((a, b) => {
      const aAt = a.lastMessage?.created_at ?? "";
      const bAt = b.lastMessage?.created_at ?? "";
      return bAt.localeCompare(aAt);
    });
}

// A single conversation, or null when the caller cannot see that request.
export async function getThread(requestId: string): Promise<MessageThread | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_requests")
    .select("id,reference,title,status,request_messages(id,body,sender_role,sender_id,created_at)")
    .eq("id", requestId)
    .maybeSingle<MessageThread>();
  return data;
}

// A request only has this companion record when it is the compliance thread
// created for an onboarding. RLS ensures clients can only read their own case.
export async function getComplianceChecklistForRequest(
  requestId: string,
): Promise<ComplianceRequestChecklist | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("onboardings")
    .select(
      "id,client_id,onboarding_documents(id,document_type_id,status,compliance_document_types(name),documents(id,title,created_at))",
    )
    .eq("compliance_request_id", requestId)
    .maybeSingle<ComplianceRequestChecklist>();
  return data;
}

export interface WorkGroupConversation {
  id: string;
  subject: string;
  created_at: string;
  assigned_provider_id: string | null;
  service_groups: { name: string } | null;
  work_group_messages: {
    id: string;
    body: string;
    sender_role: Enums<"message_sender_role">;
    sender_id: string | null;
    created_at: string;
  }[];
}

const WORK_GROUP_CONVERSATION_COLUMNS =
  "id,subject,created_at,assigned_provider_id,service_groups(name),work_group_messages(id,body,sender_role,sender_id,created_at)" as const;

// Conversations addressed to a work group. RLS scopes them: a client sees its
// own, the assigned partner sees those handed to it, staff see all.
export async function getWorkGroupConversations(): Promise<WorkGroupConversation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_group_conversations")
    .select(WORK_GROUP_CONVERSATION_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<WorkGroupConversation[]>();
  return data ?? [];
}

// A single conversation, or null when the caller may not see it.
export async function getWorkGroupConversation(
  id: string,
): Promise<WorkGroupConversation | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_group_conversations")
    .select(WORK_GROUP_CONVERSATION_COLUMNS)
    .eq("id", id)
    .maybeSingle<WorkGroupConversation>();
  return data;
}

// Work groups a client can address. Names only — never their membership.
export async function getAddressableWorkGroups(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_groups")
    .select("id,name")
    .eq("active", true)
    .order("name")
    .returns<{ id: string; name: string }[]>();
  return data ?? [];
}

// The caller's document archive, RLS-scoped: a client sees its own documents; a
// provider sees only documents attached to a request assigned to it. Each row
// carries where the caller has filed it in their own tree (document_filings is
// RLS-scoped to the caller, so the embedded filing is theirs alone).
export async function getDocumentArchive(): Promise<DocumentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id,title,category,expires_at,created_at,document_filings(category_id)")
    .order("created_at", { ascending: false })
    .returns<{
      id: string;
      title: string;
      category: Enums<"document_category">;
      expires_at: string | null;
      created_at: string;
      document_filings: { category_id: string }[];
    }[]>();

  return (data ?? []).map((doc) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    expires_at: doc.expires_at,
    created_at: doc.created_at,
    folder_id: doc.document_filings[0]?.category_id ?? null,
  }));
}

export async function getClientDashboard(): Promise<ClientDashboardData> {
  const supabase = await createClient();
  const [client, packages, requests] = await Promise.all([
    supabase.from("clients").select("id,business_name,status,artwork_path").maybeSingle(),
    supabase
      .from("client_packages")
      .select("id,name,type,tier,total_price,status,client_package_line_items(name,tier,unit_price,quantity)")
      .returns<ClientDashboardData["packages"]>(),
    supabase
      .from("service_requests")
      .select(requestRowSelect)
      .order("created_at", { ascending: false })
      .returns<RequestRow[]>(),
  ]);

  return {
    client: client.data,
    packages: packages.data ?? [],
    requests: await withClientReferences(supabase, requests.data ?? []),
  };
}

export interface ProviderDashboardData {
  // Deliberately without the business name. A partner's workspace is headed
  // with its work group and BluBook's mark, so the name is not fetched rather
  // than fetched and left unrendered — the second kind is how it comes back.
  provider: {
    id: string;
    status: Enums<"provider_status">;
    tier: Enums<"provider_tier">;
  } | null;
  capabilities: { active: boolean; services: { name: string } | null }[];
  // The work groups this partner belongs to. Requests reach them through a
  // group, so a partner in none receives nothing routed.
  workGroups: { id: string; name: string }[];
  requests: RequestRow[];
  offers: {
    id: string;
    status: Enums<"assignment_status">;
    created_at: string;
    service_requests: { id?: string; reference: string; title: string } | null;
  }[];
}

export async function getProviderDashboard(): Promise<ProviderDashboardData> {
  const supabase = await createClient();
  const [provider, capabilities, workGroups, requests, offers] = await Promise.all([
    supabase.from("providers").select("id,status,tier").maybeSingle(),
    supabase
      .from("provider_capabilities")
      .select("active,services(name)")
      .returns<ProviderDashboardData["capabilities"]>(),
    // RLS scopes work_group_members to the caller's own provider row.
    supabase
      .from("work_group_members")
      .select("service_groups(id,name)")
      .returns<{ service_groups: { id: string; name: string } | null }[]>(),
    supabase
      .from("service_requests")
      .select(requestRowSelect)
      .order("created_at", { ascending: false })
      .returns<RequestRow[]>(),
    supabase
      .from("request_assignments")
      .select("id,status,created_at,service_requests(id,reference,title)")
      .eq("status", "offered")
      .returns<ProviderDashboardData["offers"]>(),
  ]);

  return {
    provider: provider.data,
    capabilities: capabilities.data ?? [],
    workGroups: (workGroups.data ?? [])
      .map((row) => row.service_groups)
      .filter((group): group is { id: string; name: string } => group !== null)
      .sort((left, right) => left.name.localeCompare(right.name)),
    requests: await withClientReferences(supabase, requests.data ?? []),
    offers: offers.data ?? [],
  };
}

export interface StaffDashboardData {
  counts: {
    clients: number;
    providers: number;
    services: number;
    openRequests: number;
    awaitingAssignment: number;
  };
  requests: RequestRow[];
  clients: { id: string; business_name: string; status: Enums<"client_status"> }[];
  providers: { id: string; business_name: string; status: Enums<"provider_status"> }[];
  services: { id: string; name: string; active: boolean; default_turnaround_days: number | null }[];
}

export interface StaffOnboardingRow {
  id: string;
  status: Enums<"onboarding_status">;
  created_at: string;
  clients: {
    id: string;
    business_name: string;
    external_reference: string | null;
    primary_profile_id: string | null;
  } | null;
  onboarding_documents: {
    id: string;
    status: Enums<"compliance_status">;
    notes: string | null;
    document_type_id: string | null;
    compliance_document_types: { name: string } | null;
    documents: { id: string; title: string; uploaded_by: string | null; created_at: string }[];
  }[];
}

export async function getStaffOnboardings(
  search = "",
  stage: OnboardingQueueStage = "all",
): Promise<StaffOnboardingRow[]> {
  const supabase = await createClient();
  const term = search.trim().slice(0, 100);
  let clientIds: string[] | null = null;

  if (term) {
    const pattern = `%${term}%`;
    const [byName, byCustomerId] = await Promise.all([
      supabase.from("clients").select("id").ilike("business_name", pattern),
      supabase.from("clients").select("id").ilike("external_reference", pattern),
    ]);
    clientIds = Array.from(
      new Set([...(byName.data ?? []), ...(byCustomerId.data ?? [])].map((client) => client.id)),
    );
    if (clientIds.length === 0) return [];
  }

  let query = supabase
    .from("onboardings")
    .select(
      "id,status,created_at,clients(id,business_name,external_reference,primary_profile_id),onboarding_documents(id,status,notes,document_type_id,compliance_document_types(name),documents(id,title,uploaded_by,created_at))",
    )
    .order("created_at", { ascending: false });
  if (clientIds) query = query.in("client_id", clientIds);

  const { data } = await query.returns<StaffOnboardingRow[]>();
  const onboardings = data ?? [];
  return onboardings.filter((onboarding) => onboardingMatchesStage(onboarding, stage));
}

export async function getStaffDashboard(): Promise<StaffDashboardData> {
  const supabase = await createClient();
  const countOf = (table: "clients" | "providers" | "services") =>
    supabase.from(table).select("id", { count: "exact", head: true });

  const [clients, providers, services, open, awaiting, requests, providerList, serviceList, clientList] =
    await Promise.all([
    countOf("clients"),
    countOf("providers"),
    countOf("services"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(completed,cancelled)"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "awaiting_assignment"),
    supabase
      .from("service_requests")
      .select(requestRowSelect)
      .order("created_at", { ascending: false })
      .limit(25)
      .returns<RequestRow[]>(),
    supabase.from("providers").select("id,business_name,status").order("business_name"),
    supabase.from("services").select("id,name,active,default_turnaround_days").order("name"),
    supabase.from("clients").select("id,business_name,status").order("business_name"),
  ]);

  return {
    counts: {
      clients: clients.count ?? 0,
      providers: providers.count ?? 0,
      services: services.count ?? 0,
      openRequests: open.count ?? 0,
      awaitingAssignment: awaiting.count ?? 0,
    },
    requests: await withClientReferences(supabase, requests.data ?? []),
    clients: clientList.data ?? [],
    providers: providerList.data ?? [],
    services: serviceList.data ?? [],
  };
}
