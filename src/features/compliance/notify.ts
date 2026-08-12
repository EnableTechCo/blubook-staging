import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailJsConfig, sendComplianceEmail, type EmailResult } from "@/lib/email/emailjs";
import { complianceRatio, isNonCompliant, type MetricSetting } from "@/features/compliance/wcr";
import type { WeeklyFinancials } from "@/features/finance/ratios";
import { sastFiscalPeriod } from "@/lib/time";

const FINANCIAL_COLUMNS =
  "fiscal_week,net_income,non_cash_expenses,working_capital_change,earnings,taxes,depreciation,amortisation,current_assets,current_liabilities,total_liabilities,total_equity,lost_customers,total_customers";

export interface ComplianceNotifyResult {
  raised: boolean;
  ratio: number | null;
  email: EmailResult;
  reason?: string;
}

/**
 * Raises the weekly urgent notification when a client is short of compliance,
 * and copies their Compliance Manager.
 *
 * Called when a finance partner files a week, which is the cadence the brief
 * asks for: figures arrive weekly, the ratio is recomputed, and a client still
 * short of the mark is told again. Tying it to the filing rather than to a
 * scheduler means the reminder can never fire against figures nobody has
 * updated — and this application has no scheduler of its own.
 *
 * One notification per client per fiscal week. Re-filing a week corrects the
 * figures without ringing the bell a second time.
 */
export async function notifyComplianceShortfall(clientId: string): Promise<ComplianceNotifyResult> {
  const admin = createAdminClient();
  const period = sastFiscalPeriod(new Date());

  const [{ data: quarterWeeks }, { data: yearWeeks }, { data: settings }, { data: client }] =
    await Promise.all([
      admin
        .from("client_financials")
        .select(FINANCIAL_COLUMNS)
        .eq("client_id", clientId)
        .eq("fiscal_year", period.year)
        .eq("fiscal_quarter", period.quarter)
        .returns<WeeklyFinancials[]>(),
      admin
        .from("client_financials")
        .select(FINANCIAL_COLUMNS)
        .eq("client_id", clientId)
        .eq("fiscal_year", period.year)
        .returns<WeeklyFinancials[]>(),
      admin
        .from("compliance_metric_settings")
        .select("metric_key,label,weight,threshold,direction,active")
        .returns<MetricSetting[]>(),
      admin
        .from("clients")
        .select("business_name,primary_profile_id,compliance_manager_name,compliance_manager_email")
        .eq("id", clientId)
        .maybeSingle(),
    ]);

  const result = complianceRatio({
    quarterWeeks: quarterWeeks ?? [],
    yearWeeks: yearWeeks ?? [],
    settings: settings ?? [],
  });

  if (!isNonCompliant(result.quarterToDate)) {
    return {
      raised: false,
      ratio: result.quarterToDate.ratio,
      email: { status: "skipped", reason: "Compliant, or nothing measurable" },
    };
  }

  const ratio = Math.round(result.quarterToDate.ratio!);
  const short = result.quarterToDate.outcomes
    .filter((outcome) => outcome.achieved === false)
    .map((outcome) => outcome.label);
  const body = `Your compliance ratio for Q${period.quarter} week ${period.quarterWeek} is ${ratio}%. Short of target: ${short.join(", ")}.`;

  // The client is told in the platform. Only the bell-worthy ones are urgent,
  // and this is one: it repeats until the shortfall is closed.
  let raised = false;
  if (client?.primary_profile_id) {
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("recipient_id", client.primary_profile_id)
      .eq("type", "compliance_ratio")
      .gte("created_at", weekStart(period.year, period.week).toISOString())
      .limit(1);

    if ((existing ?? []).length === 0) {
      const { error } = await admin.from("notifications").insert({
        recipient_id: client.primary_profile_id,
        type: "compliance_ratio" as const,
        urgent: true,
        title: `Compliance ratio ${ratio}%`,
        body,
      });
      raised = !error;
    }
  }

  // The Compliance Manager is copied by email. Absent contact, absent copy —
  // never a failure, the same way onboarding treats an unconfigured mailer.
  if (!client?.compliance_manager_email) {
    return { raised, ratio, email: { status: "skipped", reason: "No compliance manager on record" } };
  }
  if (!emailJsConfig()) {
    return { raised, ratio, email: { status: "skipped", reason: "EmailJS is not configured" } };
  }

  const email = await sendComplianceEmail({
    toEmail: client.compliance_manager_email,
    toName: client.compliance_manager_name ?? "Compliance Manager",
    businessName: client.business_name,
    ratio: `${ratio}%`,
    period: `Q${period.quarter} week ${period.quarterWeek}, FY${period.year}`,
    shortfall: short.join(", "),
  });

  return { raised, ratio, email };
}

function weekStart(fiscalYear: number, week: number): Date {
  const yearStart = Date.UTC(fiscalYear, 2, 1); // 1 March
  return new Date(yearStart + (week - 1) * 7 * 86_400_000);
}
