import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

// View models for the dashboards. Shapes are asserted with .returns<>() so the
// embedded-select results stay strongly typed without hand-joining.

type RequestStatus = Enums<"request_status">;
type ServiceTier = Enums<"service_tier">;

const requestRowSelect =
  "id,reference,title,description,status,origin,request_type,partner_work_order_reference,created_at,updated_at,completed_at,client_id,provider_id,services(name,service_groups(name)),providers(business_name),clients(business_name,external_reference),request_assignments(id,status),request_schedules(due_at,eta_type,sla_started_at,sla_target_business_days),request_events(to_status,created_at),request_messages(id,body,created_at)" as const;

export interface RequestRow {
  id: string;
  reference: string;
  title: string;
  description?: string | null;
  status: RequestStatus;
  origin: Enums<"request_origin">;
  request_type?: string;
  partner_work_order_reference?: string | null;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  // Ids are always readable by a party to the request, and let the UI show an
  // anonymised counterparty (assigned-or-not / a pseudonym) without exposing
  // the other side's identity. Client and provider are anonymous to each other.
  client_id: string;
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
  return data;
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
  title: string;
  body: string | null;
  request_id: string | null;
  read_at: string | null;
  created_at: string;
}

// The caller's notifications (RLS-scoped to recipient), newest first.
export async function getNotifications(): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id,type,title,body,request_id,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<NotificationRow[]>();
  return data ?? [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
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

// Conversations the caller can take part in: their visible requests that have an
// assigned provider (so a counterpart exists), each with its messages. RLS
// scopes the requests (client's own / provider's assigned / staff all).
export async function getMessagingThreads(): Promise<MessageThread[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_requests")
    .select("id,reference,title,status,request_messages(id,body,sender_role,sender_id,created_at)")
    .not("provider_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<MessageThread[]>();
  return data ?? [];
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
    requests: requests.data ?? [],
  };
}

export interface ProviderDashboardData {
  provider: { id: string; business_name: string; status: Enums<"provider_status"> } | null;
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
    supabase.from("providers").select("id,business_name,status").maybeSingle(),
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
    requests: requests.data ?? [],
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
  clients: { id: string; business_name: string } | null;
  onboarding_documents: {
    id: string;
    status: Enums<"compliance_status">;
    document_type_id: string | null;
    compliance_document_types: { name: string } | null;
    documents: { id: string; title: string }[];
  }[];
}

export async function getStaffOnboardings(): Promise<StaffOnboardingRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("onboardings")
    .select(
      "id,status,created_at,clients(id,business_name),onboarding_documents(id,status,document_type_id,compliance_document_types(name),documents(id,title))",
    )
    .order("created_at", { ascending: false })
    .returns<StaffOnboardingRow[]>();
  return data ?? [];
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
    requests: requests.data ?? [],
    clients: clientList.data ?? [],
    providers: providerList.data ?? [],
    services: serviceList.data ?? [],
  };
}
