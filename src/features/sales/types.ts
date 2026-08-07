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

export interface LinkedPurchaseOrder {
  id: string;
  reference: string;
  status: string;
}

export type SalesOpportunityWithPurchaseOrder = SalesOpportunity & {
  purchaseOrder: LinkedPurchaseOrder | null;
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
  opportunities: SalesOpportunityWithPurchaseOrder[];
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
> & { purchaseOrder: LinkedPurchaseOrder };

export interface SalesBookingsData {
  bookings: SalesBooking[];
  error: string | null;
}
