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

export type OpportunitySource = Pick<
  Tables<"opportunity_sources">,
  "code" | "name" | "description" | "display_order"
>;

export type ForecastCategory = Pick<
  Tables<"forecast_categories">,
  "code" | "name" | "description" | "display_order"
>;

export interface SalesPipelineData {
  opportunities: SalesOpportunity[];
  sources: OpportunitySource[];
  categories: ForecastCategory[];
  error: string | null;
}
