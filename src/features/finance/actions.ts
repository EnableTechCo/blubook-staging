"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { financialSubmissionSchema } from "@/lib/validation/financials";
import { getCurrentProfile } from "@/services/profiles";

export type FinancialActionState = { error: string } | { ok: true; reference: string } | undefined;

function figure(formData: FormData, name: string): number {
  const raw = formData.get(name);
  // An empty field means nothing was reported, which for these figures is zero
  // rather than unknown: a balance sheet with a blank line still balances.
  if (typeof raw !== "string" || raw.trim() === "") return 0;
  return Number(raw);
}

/**
 * Records one week of financial figures for a client.
 *
 * The write goes through submit_client_financials, a SECURITY DEFINER function,
 * rather than a table grant. The partner never holds insert rights on
 * client_financials, so a mistake here cannot widen into one — the database
 * re-checks that this partner carries the financial responsibility for this
 * client and refuses otherwise.
 */
export async function submitFinancials(
  _previous: FinancialActionState,
  formData: FormData,
): Promise<FinancialActionState> {
  const profile = await getCurrentProfile();
  if (profile?.user_type !== "service_provider") {
    return { error: "Only a service partner can submit financial figures." };
  }

  const parsed = financialSubmissionSchema.safeParse({
    clientId: formData.get("clientId"),
    fiscalYear: Number(formData.get("fiscalYear")),
    fiscalQuarter: Number(formData.get("fiscalQuarter")),
    fiscalWeek: Number(formData.get("fiscalWeek")),
    netIncome: figure(formData, "netIncome"),
    nonCashExpenses: figure(formData, "nonCashExpenses"),
    workingCapitalChange: figure(formData, "workingCapitalChange"),
    earnings: figure(formData, "earnings"),
    taxes: figure(formData, "taxes"),
    depreciation: figure(formData, "depreciation"),
    amortisation: figure(formData, "amortisation"),
    currentAssets: figure(formData, "currentAssets"),
    currentLiabilities: figure(formData, "currentLiabilities"),
    totalLiabilities: figure(formData, "totalLiabilities"),
    totalEquity: figure(formData, "totalEquity"),
    lostCustomers: figure(formData, "lostCustomers"),
    totalCustomers: figure(formData, "totalCustomers"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the figures and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_client_financials", {
    p_client_id: parsed.data.clientId,
    p_fiscal_year: parsed.data.fiscalYear,
    p_fiscal_quarter: parsed.data.fiscalQuarter,
    p_fiscal_week: parsed.data.fiscalWeek,
    p_net_income: parsed.data.netIncome,
    p_non_cash_expenses: parsed.data.nonCashExpenses,
    p_working_capital_change: parsed.data.workingCapitalChange,
    p_earnings: parsed.data.earnings,
    p_taxes: parsed.data.taxes,
    p_depreciation: parsed.data.depreciation,
    p_amortisation: parsed.data.amortisation,
    p_current_assets: parsed.data.currentAssets,
    p_current_liabilities: parsed.data.currentLiabilities,
    p_total_liabilities: parsed.data.totalLiabilities,
    p_total_equity: parsed.data.totalEquity,
    p_lost_customers: parsed.data.lostCustomers,
    p_total_customers: parsed.data.totalCustomers,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/financials");
  return {
    ok: true,
    reference: `Q${parsed.data.fiscalQuarter} week ${parsed.data.fiscalWeek}, FY${parsed.data.fiscalYear}`,
  };
}
