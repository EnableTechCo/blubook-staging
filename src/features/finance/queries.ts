import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sastFiscalPeriod } from "@/lib/time";
import type { WeeklyFinancials } from "@/features/finance/ratios";

export interface SubmissionClient {
  id: string;
  external_reference: string | null;
  /** Present only where the partner is already entitled to the identity. */
  business_name: string | null;
}

export interface SubmissionOverviewRow {
  client_id: string;
  external_reference: string | null;
  business_name: string | null;
  submitted_at: string | null;
  evidence_document_id: string | null;
  evidence_title: string | null;
}

export interface FinancialOverviewData {
  rows: SubmissionOverviewRow[];
  fiscalYear: number;
  fiscalQuarter: number;
  fiscalWeek: number;
  error: string | null;
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

/**
 * The list layer: every client this partner is responsible for, and whether the
 * given week has been filed for them.
 *
 * The period comes from the application's fiscal calendar and is passed in, so
 * there is no second definition of a fiscal week written in SQL.
 */
export async function getFinancialOverview(
  fiscalYear?: number,
  fiscalQuarter?: number,
  fiscalWeek?: number,
): Promise<FinancialOverviewData> {
  const period = sastFiscalPeriod(new Date());
  const year = fiscalYear ?? period.year;
  const quarter = fiscalQuarter ?? period.quarter;
  const week = fiscalWeek ?? period.quarterWeek;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("financial_submission_overview", {
    p_fiscal_year: year,
    p_fiscal_quarter: quarter,
    p_fiscal_week: week,
  });

  return {
    rows: (data ?? []) as SubmissionOverviewRow[],
    fiscalYear: year,
    fiscalQuarter: quarter,
    fiscalWeek: week,
    error: error?.message ?? null,
  };
}

/** One client's row, for the form layer. Null when the partner may not file for them. */
export async function getSubmissionClient(clientId: string): Promise<SubmissionClient | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("financial_submission_clients")
    .select("id,external_reference,business_name")
    .eq("id", clientId)
    .maybeSingle<SubmissionClient>();
  return data ?? null;
}

export interface ClientFinanceData {
  fiscalYear: number;
  fiscalQuarter: number;
  weeks: WeeklyFinancials[];
  error: string | null;
}

/**
 * A client's own filed figures for one quarter.
 *
 * Read straight from the table: client_financials_select_own admits the client
 * and staff, so this needs no widening function. A partner reaches nothing here
 * — they write through the submission entry point and cannot read the history.
 */
export async function getClientFinancials(
  fiscalYear?: number,
  fiscalQuarter?: number,
): Promise<ClientFinanceData> {
  const period = sastFiscalPeriod(new Date());
  const year = fiscalYear ?? period.year;
  const quarter = fiscalQuarter ?? period.quarter;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_financials")
    .select(
      "fiscal_week,net_income,non_cash_expenses,working_capital_change,earnings,taxes,depreciation,amortisation,current_assets,current_liabilities,total_liabilities,total_equity,lost_customers,total_customers",
    )
    .eq("fiscal_year", year)
    .eq("fiscal_quarter", quarter)
    .order("fiscal_week")
    .returns<WeeklyFinancials[]>();

  return {
    fiscalYear: year,
    fiscalQuarter: quarter,
    weeks: data ?? [],
    error: error?.message ?? null,
  };
}
