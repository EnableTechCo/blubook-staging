"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireStaffRole } from "@/services/staffRole";
import { lineItemSchema, packageSchema } from "@/lib/validation/catalogue";

export type CatalogueState = { error: string } | { ok: true } | undefined;

export type NewLineItemState =
  | { error: string }
  | { ok: true; lineItem: { id: string; name: string } }
  | undefined;

// Packages are catalogue reference data, so RLS already restricts writes to
// staff; the guard here fails fast with a readable message instead of an
// empty-result write.
// Packages and line items carry price, which is a commercial decision rather
// than a delivery one. Services and routing sit with operations instead.
async function requireStaff(): Promise<string | null> {
  return requireStaffRole("sales_admin");
}

function readPackageForm(formData: FormData) {
  let lineItemIds: unknown = [];
  try {
    lineItemIds = JSON.parse((formData.get("lineItemIds") as string) || "[]");
  } catch {
    lineItemIds = [];
  }

  const rawPrice = (formData.get("price") as string) ?? "";
  return packageSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    tier: formData.get("tier"),
    billingInterval: formData.get("billingInterval"),
    price: rawPrice === "" ? Number.NaN : Number(rawPrice),
    description: formData.get("description") ?? "",
    lineItemIds,
  });
}

// Sync a package's line items by diffing against what is stored, rather than
// deleting every link and re-inserting. A delete-all would churn rows that never
// changed; saving with no changes writes nothing at all.
async function syncLineItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  packageId: string,
  desiredIds: string[],
): Promise<string | null> {
  const { data, error } = await supabase
    .from("package_line_items")
    .select("line_item_id")
    .eq("package_id", packageId);
  if (error) return error.message;

  const desired = new Set(desiredIds);
  const current = new Set((data ?? []).map((row) => row.line_item_id));

  const toAdd = [...desired].filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !desired.has(id));

  if (toAdd.length > 0) {
    const { error: addError } = await supabase
      .from("package_line_items")
      .insert(toAdd.map((lineItemId) => ({ package_id: packageId, line_item_id: lineItemId })));
    if (addError) return addError.message;
  }

  if (toRemove.length > 0) {
    const { error: removeError } = await supabase
      .from("package_line_items")
      .delete()
      .eq("package_id", packageId)
      .in("line_item_id", toRemove);
    if (removeError) return removeError.message;
  }

  return null;
}

const DUPLICATE_SLUG = "23505";

export async function savePackage(
  _prev: CatalogueState,
  formData: FormData,
): Promise<CatalogueState> {
  const denied = await requireStaff();
  if (denied) return { error: denied };

  const parsed = readPackageForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const input = parsed.data;

  const packageId = z.string().uuid().safeParse(formData.get("packageId"));
  const supabase = await createClient();

  const fields = {
    name: input.name,
    slug: input.slug,
    tier: input.tier,
    billing_interval: input.billingInterval,
    price: input.price,
    description: input.description || null,
  };

  let savedId: string;
  if (packageId.success) {
    const { data, error } = await supabase
      .from("packages")
      .update(fields)
      .eq("id", packageId.data)
      .select("id")
      .single();
    if (error) {
      return {
        error:
          error.code === DUPLICATE_SLUG
            ? "That slug is already used by another package."
            : error.message,
      };
    }
    savedId = data.id;
  } else {
    const { data, error } = await supabase
      .from("packages")
      .insert(fields)
      .select("id")
      .single();
    if (error) {
      return {
        error:
          error.code === DUPLICATE_SLUG
            ? "That slug is already used by another package."
            : error.message,
      };
    }
    savedId = data.id;
  }

  const syncError = await syncLineItems(supabase, savedId, input.lineItemIds);
  if (syncError) return { error: syncError };

  revalidatePath("/dashboard/catalogue");
  revalidatePath("/dashboard/onboard");
  return { ok: true };
}

// Create a catalogue line item. Exposed from the package editor so staff can add
// a missing deliverable without leaving the package they are assembling; the
// caller selects the returned item straight away.
export async function createLineItem(
  _prev: NewLineItemState,
  formData: FormData,
): Promise<NewLineItemState> {
  const denied = await requireStaff();
  if (denied) return { error: denied };

  const rawPrice = (formData.get("price") as string) ?? "";
  const parsed = lineItemSchema.safeParse({
    serviceId: formData.get("serviceId"),
    name: formData.get("name"),
    tier: formData.get("tier"),
    fulfilmentMode: formData.get("fulfilmentMode"),
    price: rawPrice === "" ? Number.NaN : Number(rawPrice),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const input = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("line_items")
    .insert({
      service_id: input.serviceId,
      name: input.name,
      tier: input.tier,
      price: input.price,
      fulfilment_mode: input.fulfilmentMode,
    })
    .select("id,name")
    .single();

  if (error) {
    return {
      error:
        error.code === DUPLICATE_SLUG
          ? "That service already has a line item with this name."
          : error.message,
    };
  }

  revalidatePath("/dashboard/catalogue");
  return { ok: true, lineItem: data };
}

// Packages are retired, never deleted: client packages reference them as their
// source, so a delete would either fail the foreign key or strip that history.
export async function setPackageActive(formData: FormData): Promise<void> {
  if (await requireStaff()) return;

  const parsed = z
    .object({ packageId: z.string().uuid(), active: z.enum(["true", "false"]) })
    .safeParse({ packageId: formData.get("packageId"), active: formData.get("active") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("packages")
    .update({ active: parsed.data.active === "true" })
    .eq("id", parsed.data.packageId);

  revalidatePath("/dashboard/catalogue");
  revalidatePath("/dashboard/onboard");
}
