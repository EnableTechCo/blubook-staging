import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

// View models for the dashboards. Shapes are asserted with .returns<>() so the
// embedded-select results stay strongly typed without hand-joining.

type RequestStatus = Enums<"request_status">;
type ServiceTier = Enums<"service_tier">;

export interface RequestRow {
  id: string;
  reference: string;
  title: string;
  status: RequestStatus;
  origin: Enums<"request_origin">;
  created_at: string;
  // Ids are always readable by a party to the request, and let the UI show an
  // anonymised counterparty (assigned-or-not / a pseudonym) without exposing
  // the other side's identity. Client and provider are anonymous to each other.
  client_id: string;
  provider_id: string | null;
  services: { name: string } | null;
  // Embedded names resolve only for staff (the intermediary); RLS returns null
  // for the counterparty, preserving anonymity.
  providers: { business_name: string } | null;
  clients: { business_name: string } | null;
  // request_schedules is 1:1 with service_requests, so it embeds as an object.
  request_schedules: { due_at: string | null; eta_type: Enums<"eta_type"> } | null;
}

export interface ClientDashboardData {
  client: { id: string; business_name: string; status: Enums<"client_status"> } | null;
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
  onboardings: {
    id: string;
    status: Enums<"onboarding_status">;
    onboarding_documents: { status: Enums<"compliance_status">; compliance_document_types: { name: string } | null }[];
  }[];
}

export async function getClientDashboard(): Promise<ClientDashboardData> {
  const supabase = await createClient();
  const [client, packages, requests, onboardings] = await Promise.all([
    supabase.from("clients").select("id,business_name,status").maybeSingle(),
    supabase
      .from("client_packages")
      .select("id,name,type,tier,total_price,status,client_package_line_items(name,tier,unit_price,quantity)")
      .returns<ClientDashboardData["packages"]>(),
    supabase
      .from("service_requests")
      .select(
        "id,reference,title,status,origin,created_at,client_id,provider_id,services(name),providers(business_name),clients(business_name),request_schedules(due_at,eta_type)",
      )
      .order("created_at", { ascending: false })
      .returns<RequestRow[]>(),
    supabase
      .from("onboardings")
      .select("id,status,onboarding_documents(status,compliance_document_types(name))")
      .returns<ClientDashboardData["onboardings"]>(),
  ]);

  return {
    client: client.data,
    packages: packages.data ?? [],
    requests: requests.data ?? [],
    onboardings: onboardings.data ?? [],
  };
}

export interface ProviderDashboardData {
  provider: { id: string; business_name: string; status: Enums<"provider_status"> } | null;
  capabilities: { active: boolean; services: { name: string } | null }[];
  requests: RequestRow[];
  offers: {
    id: string;
    status: Enums<"assignment_status">;
    created_at: string;
    service_requests: { reference: string; title: string } | null;
  }[];
}

export async function getProviderDashboard(): Promise<ProviderDashboardData> {
  const supabase = await createClient();
  const [provider, capabilities, requests, offers] = await Promise.all([
    supabase.from("providers").select("id,business_name,status").maybeSingle(),
    supabase
      .from("provider_capabilities")
      .select("active,services(name)")
      .returns<ProviderDashboardData["capabilities"]>(),
    supabase
      .from("service_requests")
      .select(
        "id,reference,title,status,origin,created_at,client_id,provider_id,services(name),providers(business_name),clients(business_name),request_schedules(due_at,eta_type)",
      )
      .order("created_at", { ascending: false })
      .returns<RequestRow[]>(),
    supabase
      .from("request_assignments")
      .select("id,status,created_at,service_requests(reference,title)")
      .eq("status", "offered")
      .returns<ProviderDashboardData["offers"]>(),
  ]);

  return {
    provider: provider.data,
    capabilities: capabilities.data ?? [],
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
  providers: { id: string; business_name: string; status: Enums<"provider_status"> }[];
  services: { id: string; name: string; active: boolean; default_turnaround_days: number | null }[];
}

export async function getStaffDashboard(): Promise<StaffDashboardData> {
  const supabase = await createClient();
  const countOf = (table: "clients" | "providers" | "services") =>
    supabase.from(table).select("id", { count: "exact", head: true });

  const [clients, providers, services, open, awaiting, requests, providerList, serviceList] = await Promise.all([
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
      .select(
        "id,reference,title,status,origin,created_at,client_id,provider_id,services(name),providers(business_name),clients(business_name),request_schedules(due_at,eta_type)",
      )
      .order("created_at", { ascending: false })
      .limit(25)
      .returns<RequestRow[]>(),
    supabase.from("providers").select("id,business_name,status").order("business_name"),
    supabase.from("services").select("id,name,active,default_turnaround_days").order("name"),
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
    providers: providerList.data ?? [],
    services: serviceList.data ?? [],
  };
}
