import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requestRowSelect, withClientReferences, type RequestRow } from "@/services/requests";
import type { Enums } from "@/types/database";

/**
 * The three per-role landing summaries.
 *
 * Each fans out in one Promise.all and stitches the results into a view model.
 * They share nothing but the request read model, which is why that lives in
 * requests.ts and this file only assembles.
 */

type ServiceTier = Enums<"service_tier">;

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
