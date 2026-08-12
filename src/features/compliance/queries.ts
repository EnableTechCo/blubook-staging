import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sastFiscalPeriod } from "@/lib/time";
import type { WeeklyFinancials } from "@/features/finance/ratios";
import { complianceRatio, type ComplianceResult, type MetricSetting } from "@/features/compliance/wcr";

const FINANCIAL_COLUMNS =
  "fiscal_week,net_income,non_cash_expenses,working_capital_change,earnings,taxes,depreciation,amortisation,current_assets,current_liabilities,total_liabilities,total_equity,lost_customers,total_customers";

export interface ComplianceData {
  fiscalYear: number;
  fiscalQuarter: number;
  settings: MetricSetting[];
  result: ComplianceResult;
  error: string | null;
}

/**
 * The client's compliance position for the current period.
 *
 * Quarter and year are fetched separately because they are different windows
 * over the same table, and the year-to-date figure has to include quarters that
 * have already closed.
 */
export async function getComplianceRatio(): Promise<ComplianceData> {
  const period = sastFiscalPeriod(new Date());
  const supabase = await createClient();

  const [quarter, year, settings] = await Promise.all([
    supabase
      .from("client_financials")
      .select(FINANCIAL_COLUMNS)
      .eq("fiscal_year", period.year)
      .eq("fiscal_quarter", period.quarter)
      .order("fiscal_week")
      .returns<WeeklyFinancials[]>(),
    supabase
      .from("client_financials")
      .select(FINANCIAL_COLUMNS)
      .eq("fiscal_year", period.year)
      .order("fiscal_week")
      .returns<WeeklyFinancials[]>(),
    supabase
      .from("compliance_metric_settings")
      .select("metric_key,label,weight,threshold,direction,active")
      .order("metric_key")
      .returns<MetricSetting[]>(),
  ]);

  return {
    fiscalYear: period.year,
    fiscalQuarter: period.quarter,
    settings: settings.data ?? [],
    result: complianceRatio({
      quarterWeeks: quarter.data ?? [],
      yearWeeks: year.data ?? [],
      settings: settings.data ?? [],
    }),
    error: quarter.error?.message ?? settings.error?.message ?? null,
  };
}

/** The weight and threshold table, for the staff page that maintains it. */
export async function getComplianceSettings(): Promise<MetricSetting[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("compliance_metric_settings")
    .select("metric_key,label,weight,threshold,direction,active")
    .order("metric_key")
    .returns<MetricSetting[]>();
  return data ?? [];
}
