import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sastFiscalPeriod } from "@/lib/time";

export interface SubmissionClient {
  id: string;
  external_reference: string | null;
  /** Present only where the partner is already entitled to the identity. */
  business_name: string | null;
}

export interface FinancialIntakeData {
  clients: SubmissionClient[];
  fiscalYear: number;
  fiscalQuarter: number;
  fiscalWeek: number;
  error: string | null;
}

/**
 * What a finance partner needs to file a week of figures.
 *
 * The client list comes from financial_submission_clients, which applies the
 * same gate the write does — so the form can only ever offer a client the
 * database would accept, and a partner with no financial responsibility gets
 * an empty list rather than a form that fails on submit.
 */
export async function getFinancialIntake(): Promise<FinancialIntakeData> {
  const period = sastFiscalPeriod(new Date());
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financial_submission_clients")
    .select("id,external_reference,business_name")
    .order("external_reference")
    .returns<SubmissionClient[]>();

  return {
    clients: data ?? [],
    fiscalYear: period.year,
    fiscalQuarter: period.quarter,
    fiscalWeek: period.quarterWeek,
    error: error?.message ?? null,
  };
}

/** Whether the caller may file financial figures at all — drives the nav entry. */
export async function canSubmitFinancials(): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("financial_submission_clients")
    .select("id", { count: "exact", head: true });
  return (count ?? 0) > 0;
}
