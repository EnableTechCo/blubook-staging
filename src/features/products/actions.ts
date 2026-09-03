"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { DEFAULT_VAT_RATE } from "@/features/products/productList";
import { productFileError, readProductWorkbook } from "@/features/products/productWorkbook";

export type ProductUploadState =
  | { error: string }
  | { ok: true; added: number; updated: number; issues: { row: number; message: string }[] }
  | undefined;

export type ProductRowState = { error: string } | { ok: true } | undefined;

const productSchema = z.object({
  productId: z.string().uuid().optional(),
  productCode: z.string().trim().min(1, "A product needs a code.").max(80),
  description: z.string().trim().min(1, "A product needs a description.").max(400),
  unit: z.string().trim().max(40).optional(),
  unitPrice: z.coerce.number().min(0, "A price cannot be negative.").max(999999999999.99),
  vatRate: z.coerce.number().min(0).max(100).default(DEFAULT_VAT_RATE),
  category: z.string().trim().max(80).optional(),
});

/** The signed-in client, or a message saying why there isn't one. */
async function currentClient(): Promise<{ id: string } | string> {
  const profile = await getCurrentProfile();
  if (!profile) return "Not authenticated.";
  if (profile.user_type !== "client") return "Only a client can maintain a product list.";

  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("id").maybeSingle();
  return data ?? "No client account is linked to your profile.";
}

/**
 * Replace or extend the product list from a spreadsheet.
 *
 * An upload adds and updates by product code; it does not delete. A price list
 * is often sent as a partial update — this quarter's changes rather than the
 * whole book — and silently withdrawing everything absent from the file would
 * empty a catalogue on an ordinary action. Withdrawing is deliberate, one row
 * at a time, on the page.
 */
export async function uploadProductList(
  _previous: ProductUploadState,
  formData: FormData,
): Promise<ProductUploadState> {
  const client = await currentClient();
  if (typeof client === "string") return { error: client };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a spreadsheet to upload." };

  const fileError = productFileError(file);
  if (fileError) return { error: fileError };

  const { products, issues } = await readProductWorkbook(file);
  if (products.length === 0) {
    return {
      error:
        issues[0]?.message ?? "No products could be read from that file.",
    };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("client_products")
    .select("product_code")
    .eq("client_id", client.id);
  const known = new Set((existing ?? []).map((row) => row.product_code.toLowerCase()));

  const { error } = await supabase.from("client_products").upsert(
    products.map((product) => ({ ...product, client_id: client.id, active: true })),
    { onConflict: "client_id,product_code" },
  );
  if (error) return { error: error.message };

  const updated = products.filter((product) => known.has(product.product_code.toLowerCase())).length;

  revalidatePath("/dashboard/sales/products");
  return { ok: true, added: products.length - updated, updated, issues };
}

/** Add one product, or correct one already on the list. */
export async function saveProduct(
  _previous: ProductRowState,
  formData: FormData,
): Promise<ProductRowState> {
  const client = await currentClient();
  if (typeof client === "string") return { error: client };

  const parsed = productSchema.safeParse({
    productId: formData.get("productId") || undefined,
    productCode: formData.get("productCode"),
    description: formData.get("description"),
    unit: formData.get("unit") || undefined,
    unitPrice: formData.get("unitPrice"),
    vatRate: formData.get("vatRate") || DEFAULT_VAT_RATE,
    category: formData.get("category") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the values." };

  const values = {
    product_code: parsed.data.productCode,
    description: parsed.data.description,
    unit: parsed.data.unit ?? null,
    unit_price: parsed.data.unitPrice,
    vat_rate: parsed.data.vatRate,
    category: parsed.data.category ?? null,
  };
  const supabase = await createClient();
  const { error } = parsed.data.productId
    ? await supabase
        .from("client_products")
        .update(values)
        .eq("id", parsed.data.productId)
        .eq("client_id", client.id)
    : await supabase.from("client_products").insert({ ...values, client_id: client.id, active: true });
  if (error) return { error: error.message.includes("client_products_client_id_product_code_key") ? "That product code is already in use." : error.message };

  revalidatePath("/dashboard/sales/products");
  return { ok: true };
}

/**
 * Withdraw a product, or bring it back.
 *
 * Never a delete. A quotation that already quoted it has to keep explaining
 * itself, so the row stays and only stops being offered.
 */
export async function setProductActive(formData: FormData): Promise<void> {
  const client = await currentClient();
  if (typeof client === "string") return;

  const parsed = z
    .object({ productId: z.string().uuid(), active: z.enum(["true", "false"]) })
    .safeParse({ productId: formData.get("productId"), active: formData.get("active") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("client_products")
    .update({ active: parsed.data.active === "true" })
    .eq("id", parsed.data.productId)
    .eq("client_id", client.id);

  revalidatePath("/dashboard/sales/products");
}

/** Remove a product from the price book without altering quoted snapshots. */
export async function deleteProduct(formData: FormData): Promise<void> {
  const client = await currentClient();
  if (typeof client === "string") return;

  const productId = z.string().uuid().safeParse(formData.get("productId"));
  if (!productId.success) return;

  await (await createClient())
    .from("client_products")
    .delete()
    .eq("id", productId.data)
    .eq("client_id", client.id);

  revalidatePath("/dashboard/sales/products");
}