import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  onboardingMatchesStage,
  type OnboardingQueueStage,
} from "@/services/onboardingFilters";
import type { Enums } from "@/types/database";

/** The staff onboarding queue, and the compliance checklist a thread may carry. */

interface StaffOnboardingRow {
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
