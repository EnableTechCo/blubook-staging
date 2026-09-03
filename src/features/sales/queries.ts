import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  SalesBookingsData,
  SalesPipelineData,
  SalesPerformanceData,
  SalesTargetsData,
} from "@/features/sales/types";
import { FISCAL_QUARTERS, FISCAL_WEEKS_PER_QUARTER, sastFiscalPeriod } from "@/lib/time";

export async function getSalesPipeline(): Promise<SalesPipelineData> {
  const supabase = await createClient();
  const [opportunities, salesOrders, sources, categories] = await Promise.all([
    supabase
      .from("sales_opportunities")
      .select(
        "id,deal_reference,expected_close_date,opportunity_source,opportunity_name,forecast_category,revenue,currency,fiscal_year,fiscal_quarter,fiscal_week,booked_at,updated_at",
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("service_requests")
      .select("id,reference,status,title,description,created_at,sales_opportunity_id")
      .eq("request_type", "sales_order")
      .not("sales_opportunity_id", "is", null),
    supabase
      .from("opportunity_sources")
      .select("code,name,description,display_order")
      .order("display_order"),
    supabase
      .from("forecast_categories")
      .select("code,name,description,display_order")
      .order("display_order"),
  ]);

  const error = opportunities.error ?? salesOrders.error ?? sources.error ?? categories.error;
  const salesOrderByOpportunity = new Map(
    (salesOrders.data ?? []).map((request) => [request.sales_opportunity_id, request]),
  );
  return {
    opportunities: (opportunities.data ?? []).map((opportunity) => ({
      ...opportunity,
      salesOrder: salesOrderByOpportunity.get(opportunity.id) ?? null,
    })),
    sources: sources.data ?? [],
    categories: categories.data ?? [],
    error: error?.message ?? null,
  };
}

export async function getSalesBookings(): Promise<SalesBookingsData> {
  const supabase = await createClient();
  const [opportunities, salesOrders] = await Promise.all([
    supabase
      .from("sales_opportunities")
      .select(
        "id,deal_reference,expected_close_date,opportunity_name,invoice_number,revenue,currency,payment_status,paid_at,fiscal_year,fiscal_quarter,fiscal_week,booked_at,updated_at",
      )
      .not("booked_at", "is", null)
      .order("booked_at", { ascending: false }),
    supabase
      .from("service_requests")
      .select("id,reference,status,sales_opportunity_id")
      .eq("request_type", "sales_order")
      .eq("status", "completed")
      .not("sales_opportunity_id", "is", null),
  ]);
  const salesOrderByOpportunity = new Map(
    (salesOrders.data ?? []).map((request) => [request.sales_opportunity_id, request]),
  );
  return {
    bookings: (opportunities.data ?? []).flatMap((opportunity) => {
      const salesOrder = salesOrderByOpportunity.get(opportunity.id);
      return salesOrder ? [{ ...opportunity, salesOrder }] : [];
    }),
    error: opportunities.error?.message ?? salesOrders.error?.message ?? null,
  };
}

/**
 * The four quarters of one fiscal year, each with its target or null.
 *
 * Every quarter is returned whether or not a target exists for it, so the page
 * can offer an empty field to fill rather than making the client discover that
 * a quarter can be added at all.
 */
export async function getSalesTargets(fiscalYear?: number): Promise<SalesTargetsData> {
  const today = sastFiscalPeriod(new Date());
  const year = fiscalYear ?? today.year;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_sales_targets")
    .select("id,fiscal_year,fiscal_quarter,fiscal_week,revenue_target,currency,updated_at")
    .eq("fiscal_year", year)
    .order("fiscal_quarter");

  const rows = data ?? [];
  // A row with no week is the quarter total; the rest are that quarter's weeks.
  const byQuarter = new Map(
    rows.filter((row) => row.fiscal_week === null).map((row) => [row.fiscal_quarter, row]),
  );

  return {
    fiscalYear: year,
    currentQuarter: today.quarter,
    isCurrentYear: year === today.year,
    quarters: Array.from({ length: FISCAL_QUARTERS }, (_, index) => ({
      quarter: index + 1,
      target: byQuarter.get(index + 1) ?? null,
      weeks: rows
        .filter((row) => row.fiscal_quarter === index + 1 && row.fiscal_week !== null)
        .sort((left, right) => (left.fiscal_week ?? 0) - (right.fiscal_week ?? 0)),
    })),
    error: error?.message ?? null,
  };
}

/**
 * Everything the Sales Dash and the phasing charts need for one quarter.
 *
 * The quarter is selectable rather than always "now", because the fiscal week
 * and quarter on an opportunity are entered by the client, not derived from a
 * date — so the pipeline can hold work for a quarter the calendar has not
 * reached, and a dashboard locked to today would show an empty chart.
 *
 * throughWeek is what stops the actual line: the current week for the quarter
 * in progress, the full thirteen for one already finished, and nothing at all
 * for a quarter still ahead.
 */
export async function getSalesPerformance(
  fiscalYear?: number,
  fiscalQuarter?: number,
): Promise<SalesPerformanceData> {
  const today = sastFiscalPeriod(new Date());
  const year = fiscalYear ?? today.year;
  const quarter = fiscalQuarter ?? today.quarter;

  // Only the quarter in progress is partial. A finished quarter is a complete
  // record, and a future one holds work the client has deliberately dated
  // ahead — reporting either as "nothing has happened yet" would hide real
  // pipeline behind an accident of the calendar.
  const isCurrentQuarter = year === today.year && quarter === today.quarter;
  const throughWeek = isCurrentQuarter ? today.quarterWeek : FISCAL_WEEKS_PER_QUARTER;

  const supabase = await createClient();
  const [opportunities, target, categories] = await Promise.all([
    supabase
      .from("sales_opportunities")
      .select("revenue,forecast_category,fiscal_year,fiscal_quarter,fiscal_week")
      .eq("fiscal_year", year)
      .eq("fiscal_quarter", quarter),
    supabase
      .from("client_sales_targets")
      .select("fiscal_week,revenue_target")
      .eq("fiscal_year", year)
      .eq("fiscal_quarter", quarter),
    supabase
      .from("forecast_categories")
      .select("code,name,description,display_order")
      .order("display_order"),
  ]);

  return {
    fiscalYear: year,
    fiscalQuarter: quarter,
    throughWeek,
    isCurrentQuarter,
    opportunities: opportunities.data ?? [],
    target: (() => {
      const total = (target.data ?? []).find((row) => row.fiscal_week === null);
      return total ? Number(total.revenue_target) : null;
    })(),
    weeklyTargets: Object.fromEntries(
      (target.data ?? [])
        .filter((row) => row.fiscal_week !== null)
        .map((row) => [row.fiscal_week as number, Number(row.revenue_target)]),
    ),
    categories: categories.data ?? [],
    error: opportunities.error?.message ?? null,
  };
}
