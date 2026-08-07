import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SalesPipelineData } from "@/features/sales/types";

export async function getSalesPipeline(): Promise<SalesPipelineData> {
  const supabase = await createClient();
  const [opportunities, sources, categories] = await Promise.all([
    supabase
      .from("sales_opportunities")
      .select(
        "id,deal_reference,opportunity_source,opportunity_name,forecast_category,revenue,currency,fiscal_year,fiscal_quarter,fiscal_week,booked_at,updated_at",
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("opportunity_sources")
      .select("code,name,description,display_order")
      .order("display_order"),
    supabase
      .from("forecast_categories")
      .select("code,name,description,display_order")
      .order("display_order"),
  ]);

  const error = opportunities.error ?? sources.error ?? categories.error;
  return {
    opportunities: opportunities.data ?? [],
    sources: sources.data ?? [],
    categories: categories.data ?? [],
    error: error?.message ?? null,
  };
}
