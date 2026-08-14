import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type QuotationRow = Pick<
  Tables<"quotations">,
  | "id" | "reference" | "recipient_name" | "recipient_company"
  | "issue_date" | "expires_at" | "total" | "document_id"
>;

/** The client's quotations, newest first. */
export async function getQuotations(): Promise<QuotationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotations")
    .select("id,reference,recipient_name,recipient_company,issue_date,expires_at,total,document_id")
    .order("issue_date", { ascending: false })
    .order("reference", { ascending: false })
    .returns<QuotationRow[]>();
  return data ?? [];
}
