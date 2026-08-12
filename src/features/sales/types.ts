import type { PhasingOpportunity } from "@/features/sales/phasing";
import type { Tables } from "@/types/database";

export type SalesOpportunity = Pick<
  Tables<"sales_opportunities">,
  | "id"
  | "deal_reference"
  | "opportunity_source"
  | "opportunity_name"
  | "forecast_category"
  | "revenue"
  | "currency"
  | "fiscal_year"
  | "fiscal_quarter"
  | "fiscal_week"
  | "booked_at"
  | "updated_at"
>;

export interface LinkedSalesOrder {
  id: string;
  reference: string;
  status: string;
}

export type SalesOpportunityWithSalesOrder = SalesOpportunity & {
  salesOrder: LinkedSalesOrder | null;
};

/**
 * The pipeline reads more of the linked sales order than anywhere else,
 * because it shows one in a dialog rather than sending you to its page.
 */
export interface PipelineSalesOrder extends LinkedSalesOrder {
  title: string;
  description: string | null;
  created_at: string;
}

export type PipelineOpportunity = SalesOpportunity & {
  salesOrder: PipelineSalesOrder | null;
};

export type OpportunitySource = Pick<
  Tables<"opportunity_sources">,
  "code" | "name" | "description" | "display_order"
>;

export type ForecastCategory = Pick<
  Tables<"forecast_categories">,
  "code" | "name" | "description" | "display_order"
>;

export interface SalesPipelineData {
  opportunities: PipelineOpportunity[];
  sources: OpportunitySource[];
  categories: ForecastCategory[];
  error: string | null;
}

export type SalesBooking = Pick<
  Tables<"sales_opportunities">,
  | "id"
  | "deal_reference"
  | "opportunity_name"
  | "invoice_number"
  | "revenue"
  | "currency"
  | "payment_status"
  | "paid_at"
  | "fiscal_year"
  | "fiscal_quarter"
  | "fiscal_week"
  | "booked_at"
  | "updated_at"
> & { salesOrder: LinkedSalesOrder };

export interface SalesBookingsData {
  bookings: SalesBooking[];
  error: string | null;
}

export type SalesTarget = Pick<
  Tables<"client_sales_targets">,
  | "id"
  | "fiscal_year"
  | "fiscal_quarter"
  | "fiscal_week"
  | "revenue_target"
  | "currency"
  | "updated_at"
>;

export interface SalesTargetsData {
  /** The fiscal year being shown, and the quarter the platform is in today. */
  fiscalYear: number;
  currentQuarter: number;
  /** Whether the year shown is the one today falls in. */
  isCurrentYear: boolean;
  /**
   * One entry per quarter, in order. `target` is the quarter total, null when
   * unset; `weeks` holds only the weeks the client has overridden.
   */
  quarters: { quarter: number; target: SalesTarget | null; weeks: SalesTarget[] }[];
  error: string | null;
}

export interface SalesPerformanceData {
  fiscalYear: number;
  fiscalQuarter: number;
  /** How far into the quarter we are: 1–13, or 13 for a quarter already past. */
  throughWeek: number;
  /** Whether the period shown is the one today falls in. */
  isCurrentQuarter: boolean;
  opportunities: PhasingOpportunity[];
  /** Null when the client has set no target for this quarter. */
  target: number | null;
  /** Weeks the client has given their own figure, keyed by week number. */
  weeklyTargets: Record<number, number>;
  /** Forecast definitions, for the legend. Seeded from the workbook. */
  categories: ForecastCategory[];
  error: string | null;
}
