import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type ClientProduct = Pick<
  Tables<"client_products">,
  | "id"
  | "product_code"
  | "description"
  | "unit"
  | "unit_price"
  | "vat_rate"
  | "category"
  | "active"
  | "updated_at"
>;

/**
 * The signed-in client's product list.
 *
 * Withdrawn products come back too, and sort last. They are still part of the
 * list — a quotation that quoted one has to keep making sense — and hiding them
 * would make a code that cannot be re-added look like a bug.
 */
export async function getClientProducts(): Promise<ClientProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_products")
    .select("id,product_code,description,unit,unit_price,vat_rate,category,active,updated_at")
    .order("active", { ascending: false })
    .order("product_code")
    .returns<ClientProduct[]>();

  return data ?? [];
}
