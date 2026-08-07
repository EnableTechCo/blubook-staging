import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SalesBookingsData, SalesPipelineData } from "@/features/sales/types";

export async function getSalesPipeline(): Promise<SalesPipelineData> {
  const supabase = await createClient();
  const [opportunities, purchaseOrders, sources, categories] = await Promise.all([
    supabase
      .from("sales_opportunities")
      .select(
        "id,deal_reference,opportunity_source,opportunity_name,forecast_category,revenue,currency,fiscal_year,fiscal_quarter,fiscal_week,booked_at,updated_at",
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("service_requests")
      .select("id,reference,status,sales_opportunity_id")
      .eq("request_type", "purchase_order")
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

  const error = opportunities.error ?? purchaseOrders.error ?? sources.error ?? categories.error;
  const purchaseOrderByOpportunity = new Map(
    (purchaseOrders.data ?? []).map((request) => [request.sales_opportunity_id, request]),
  );
  return {
    opportunities: (opportunities.data ?? []).map((opportunity) => ({
      ...opportunity,
      purchaseOrder: purchaseOrderByOpportunity.get(opportunity.id) ?? null,
    })),
    sources: sources.data ?? [],
    categories: categories.data ?? [],
    error: error?.message ?? null,
  };
}

export async function getSalesBookings(): Promise<SalesBookingsData> {
  const supabase = await createClient();
  const [opportunities, purchaseOrders] = await Promise.all([
    supabase
      .from("sales_opportunities")
      .select(
        "id,deal_reference,opportunity_name,invoice_number,revenue,currency,payment_status,paid_at,fiscal_year,fiscal_quarter,fiscal_week,booked_at,updated_at",
      )
      .not("booked_at", "is", null)
      .order("booked_at", { ascending: false }),
    supabase
      .from("service_requests")
      .select("id,reference,status,sales_opportunity_id")
      .eq("request_type", "purchase_order")
      .eq("status", "completed")
      .not("sales_opportunity_id", "is", null),
  ]);
  const purchaseOrderByOpportunity = new Map(
    (purchaseOrders.data ?? []).map((request) => [request.sales_opportunity_id, request]),
  );
  return {
    bookings: (opportunities.data ?? []).flatMap((opportunity) => {
      const purchaseOrder = purchaseOrderByOpportunity.get(opportunity.id);
      return purchaseOrder ? [{ ...opportunity, purchaseOrder }] : [];
    }),
    error: opportunities.error?.message ?? purchaseOrders.error?.message ?? null,
  };
}
