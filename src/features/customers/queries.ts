import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

export interface CustomerDirectoryRow {
  id: string;
  customerId: string;
  tradingName: string;
  registeredName: string;
  entityType: Enums<"client_entity_type"> | null;
  industry: string | null;
  status: Enums<"client_status">;
  contactName: string | null;
  contactEmail: string | null;
  packageName: string | null;
  updatedAt: string;
}

export async function getCustomers(search = ""): Promise<CustomerDirectoryRow[]> {
  const supabase = await createClient();
  const term = search.trim().slice(0, 100);
  let matchingIds: string[] | null = null;

  if (term) {
    const pattern = `%${term}%`;
    const [trading, registered, customerId, contactNames, contactEmails] = await Promise.all([
      supabase.from("clients").select("id").ilike("business_name", pattern),
      supabase.from("clients").select("id").ilike("registered_name", pattern),
      supabase.from("clients").select("id").ilike("external_reference", pattern),
      supabase.from("profiles").select("id").ilike("full_name", pattern),
      supabase.from("profiles").select("id").ilike("email", pattern),
    ]);
    const contactIds = Array.from(
      new Set(
        [...(contactNames.data ?? []), ...(contactEmails.data ?? [])].map((profile) => profile.id),
      ),
    );
    const byContact = contactIds.length
      ? await supabase.from("clients").select("id").in("primary_profile_id", contactIds)
      : { data: [] as { id: string }[] };
    matchingIds = Array.from(
      new Set(
        [
          ...(trading.data ?? []),
          ...(registered.data ?? []),
          ...(customerId.data ?? []),
          ...(byContact.data ?? []),
        ].map((client) => client.id),
      ),
    );
    if (matchingIds.length === 0) return [];
  }

  let clientsQuery = supabase
    .from("clients")
    .select("id,external_reference,business_name,registered_name,entity_type,industry,status,primary_profile_id,updated_at")
    .order("business_name")
    .limit(200);
  if (matchingIds) clientsQuery = clientsQuery.in("id", matchingIds);
  const { data: clients } = await clientsQuery;
  if (!clients?.length) return [];

  const clientIds = clients.map((client) => client.id);
  const profileIds = clients
    .map((client) => client.primary_profile_id)
    .filter((id): id is string => Boolean(id));
  const [profiles, packages] = await Promise.all([
    profileIds.length
      ? supabase.from("profiles").select("id,full_name,email").in("id", profileIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null }[] }),
    supabase
      .from("client_packages")
      .select("client_id,name,status,created_at")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false }),
  ]);
  const profileMap = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]));
  const packageMap = new Map<string, string>();
  for (const item of packages.data ?? []) {
    if (item.status === "active" && !packageMap.has(item.client_id)) {
      packageMap.set(item.client_id, item.name);
    }
  }

  return clients.map((client) => {
    const contact = client.primary_profile_id ? profileMap.get(client.primary_profile_id) : null;
    return {
      id: client.id,
      customerId: client.external_reference,
      tradingName: client.business_name,
      registeredName: client.registered_name,
      entityType: client.entity_type,
      industry: client.industry,
      status: client.status,
      contactName: contact?.full_name ?? null,
      contactEmail: contact?.email ?? null,
      packageName: packageMap.get(client.id) ?? null,
      updatedAt: client.updated_at,
    };
  });
}
