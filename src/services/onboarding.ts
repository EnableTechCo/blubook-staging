import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  onboardingMatchesStage,
  type OnboardingQueueStage,
} from "@/services/onboardingFilters";
import type { Enums } from "@/types/database";

/** The staff onboarding queue, and the compliance checklist a thread may carry. */

export interface StaffOnboardingRow {
  id: string;
  status: Enums<"onboarding_status">;
  created_at: string;
  sales_review_status: "awaiting_review" | "changes_requested" | "approved";
  sales_review_note: string | null;
  clients: {
    id: string;
    business_name: string;
    registered_name: string;
    trading_name: string;
    entity_type: Enums<"client_entity_type"> | null;
    registration_number: string | null;
    industry: string | null;
    vat_status: Enums<"vat_status"> | null;
    vat_number: string | null;
    primary_contact_job_title: string | null;
    primary_contact_phone: string | null;
    billing_contact_name: string | null;
    billing_contact_email: string | null;
    business_address_line_1: string | null;
    business_address_line_2: string | null;
    business_city: string | null;
    business_province: string | null;
    business_postal_code: string | null;
    business_country: string | null;
    billing_address_line_1: string | null;
    billing_address_line_2: string | null;
    billing_city: string | null;
    billing_province: string | null;
    billing_postal_code: string | null;
    billing_country: string | null;
    profile_version: number;
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
      "id,status,created_at,sales_review_status,sales_review_note,clients(id,business_name,registered_name,trading_name,entity_type,registration_number,industry,vat_status,vat_number,primary_contact_job_title,primary_contact_phone,billing_contact_name,billing_contact_email,business_address_line_1,business_address_line_2,business_city,business_province,business_postal_code,business_country,billing_address_line_1,billing_address_line_2,billing_city,billing_province,billing_postal_code,billing_country,profile_version,external_reference,primary_profile_id),onboarding_documents(id,status,notes,document_type_id,compliance_document_types(name),documents(id,title,uploaded_by,created_at))",
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
