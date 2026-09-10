import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { onboardClientSchema, type OnboardClientInput } from "@/lib/validation/onboarding";
import { productFileError } from "@/features/products/productWorkbook";
import { artworkError, documentError, optionalFile } from "@/features/onboarding/intakeUploads";

/**
 * The steps of onboarding a client, each on its own.
 *
 * onboardClient was a 397-line function: ten numbered steps, a rollback
 * boundary, and a post-rollback email, all in one try block. It was correct,
 * and it was untestable — the only way to exercise "a flex package with no
 * items is refused" or "a failed step removes every uploaded object" was to
 * run the whole thing against a database.
 *
 * Each step here takes the admin client as a parameter rather than creating
 * one, so a test hands in a fake and asserts what was written where. The
 * action in actions.ts is now the orchestrator: it decides the order and owns
 * the rollback boundary; these functions own the work.
 *
 * Not a "use server" module on purpose. That directive exports every function
 * as a server action reachable from the client; these are internals.
 */

export type Admin = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// 1. The form
// ---------------------------------------------------------------------------

type ParsedOnboarding = { input: OnboardClientInput } | { error: string };

export function parseOnboardingForm(formData: FormData): ParsedOnboarding {
  let lineItemIds: unknown = [];
  try {
    lineItemIds = JSON.parse((formData.get("lineItemIds") as string) || "[]");
  } catch {
    return { error: "Invalid package selection." };
  }

  const parsed = onboardClientSchema.safeParse({
    registeredName: formData.get("registeredName"),
    tradingName: formData.get("tradingName"),
    entityType: formData.get("entityType"),
    registrationNumber: formData.get("registrationNumber"),
    industry: formData.get("industry"),
    fullName: formData.get("fullName"),
    jobTitle: formData.get("jobTitle"),
    email: formData.get("email"),
    telephone: formData.get("telephone"),
    billingContactName: formData.get("billingContactName"),
    billingContactEmail: formData.get("billingContactEmail"),
    businessAddressLine1: formData.get("businessAddressLine1"),
    businessAddressLine2: formData.get("businessAddressLine2"),
    businessCity: formData.get("businessCity"),
    businessProvince: formData.get("businessProvince"),
    businessPostalCode: formData.get("businessPostalCode"),
    businessCountry: formData.get("businessCountry"),
    billingAddressLine1: formData.get("billingAddressLine1"),
    billingAddressLine2: formData.get("billingAddressLine2"),
    billingCity: formData.get("billingCity"),
    billingProvince: formData.get("billingProvince"),
    billingPostalCode: formData.get("billingPostalCode"),
    billingCountry: formData.get("billingCountry"),
    vatStatus: formData.get("vatStatus"),
    vatNumber: formData.get("vatNumber"),
    tempPassword: formData.get("tempPassword"),
    packageMode: formData.get("packageMode"),
    packageId: formData.get("packageId"),
    lineItemIds,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  return { input: parsed.data };
}

// ---------------------------------------------------------------------------
// 2. The optional files — validated before any account exists to roll back
// ---------------------------------------------------------------------------

interface IntakeFiles {
  artwork: File | null;
  purchaseOrder: File | null;
  productList: File | null;
}

export function readIntakeFiles(formData: FormData): IntakeFiles {
  return {
    artwork: optionalFile(formData.get("artwork")),
    purchaseOrder: optionalFile(formData.get("purchaseOrder")),
    productList: optionalFile(formData.get("productList")),
  };
}

export function intakeFileProblem(files: IntakeFiles): string | null {
  return (
    (files.artwork && artworkError(files.artwork)) ||
    (files.purchaseOrder && documentError(files.purchaseOrder)) ||
    (files.productList && productFileError(files.productList)) ||
    null
  );
}

// ---------------------------------------------------------------------------
// 3. The package assembly — Standard snapshots the bundle, Flex prices each item
// ---------------------------------------------------------------------------

export type LineItem = {
  id: string;
  name: string;
  tier: "basic" | "intermediate" | "professional";
  price: number;
  service_id: string;
  fulfilment_mode: "service_request" | "automatic";
};

export type Snapshot = {
  source_line_item_id: string;
  name: string;
  tier: LineItem["tier"];
  unit_price: number;
  quantity: number;
  service_id: string;
  fulfilment_mode: LineItem["fulfilment_mode"];
};

type PackageMeta = {
  type: "standard" | "flex";
  tier: LineItem["tier"] | null;
  name: string;
  total_price: number;
  // Standard packages carry the source package's term; Flex is assembled
  // from individually priced items and has none.
  billing_interval: "monthly" | "quarterly" | "annual" | "one_time" | null;
};

interface PackageAssembly {
  basePackageId: string;
  meta: PackageMeta;
  snapshots: Snapshot[];
}

export async function resolvePackageAssembly(
  admin: Admin,
  input: Pick<OnboardClientInput, "packageMode" | "packageId" | "lineItemIds">,
): Promise<PackageAssembly> {
  const { data: basePkg, error: pkgErr } = await admin
    .from("packages")
    .select("id,name,tier,price,billing_interval")
    .eq("id", input.packageId)
    .single();
  if (pkgErr || !basePkg) throw new Error("Selected package not found");

  if (input.packageMode === "standard") {
    const { data: pkgItems, error: itemsErr } = await admin
      .from("package_line_items")
      .select("quantity,line_items(id,name,tier,price,service_id,fulfilment_mode)")
      .eq("package_id", basePkg.id)
      .returns<{ quantity: number; line_items: LineItem | null }[]>();
    if (itemsErr) throw new Error(itemsErr.message);

    return {
      basePackageId: basePkg.id,
      meta: {
        type: "standard",
        tier: basePkg.tier,
        name: basePkg.name,
        total_price: basePkg.price,
        billing_interval: basePkg.billing_interval,
      },
      snapshots: (pkgItems ?? [])
        .filter((it) => it.line_items)
        .map((it) => ({
          source_line_item_id: it.line_items!.id,
          name: it.line_items!.name,
          tier: it.line_items!.tier,
          unit_price: it.line_items!.price,
          quantity: it.quantity,
          service_id: it.line_items!.service_id,
          fulfilment_mode: it.line_items!.fulfilment_mode,
        })),
    };
  }

  const { data: items, error: liErr } = await admin
    .from("line_items")
    .select("id,name,tier,price,service_id,fulfilment_mode")
    .in("id", input.lineItemIds)
    .returns<LineItem[]>();
  if (liErr) throw new Error(liErr.message);
  if (!items || items.length === 0) throw new Error("No line items selected for the flex package");

  const snapshots: Snapshot[] = items.map((li) => ({
    source_line_item_id: li.id,
    name: li.name,
    tier: li.tier,
    unit_price: li.price,
    quantity: 1,
    service_id: li.service_id,
    fulfilment_mode: li.fulfilment_mode,
  }));
  const total = snapshots.reduce((sum, s) => sum + Number(s.unit_price) * s.quantity, 0);

  return {
    basePackageId: basePkg.id,
    meta: {
      type: "flex",
      tier: null,
      name: `${basePkg.name} (Flex)`,
      total_price: total,
      billing_interval: null,
    },
    snapshots,
  };
}

// ---------------------------------------------------------------------------
// 4. The compliance checklist, from whichever document types are active
// ---------------------------------------------------------------------------

export async function buildComplianceChecklist(
  admin: Admin,
  onboardingId: string,
): Promise<{ id: string; name: string }[]> {
  const { data: docTypes } = await admin
    .from("compliance_document_types")
    .select("id,name")
    .eq("active", true);
  if (!docTypes || docTypes.length === 0) return [];

  const { data: insertedDocuments, error } = await admin
    .from("onboarding_documents")
    .insert(docTypes.map((d) => ({ onboarding_id: onboardingId, document_type_id: d.id })))
    .select("id,document_type_id");
  if (error) throw new Error(error.message);

  const names = new Map(docTypes.map((documentType) => [documentType.id, documentType.name]));
  return (insertedDocuments ?? []).map((document) => ({
    id: document.id,
    name: names.get(document.document_type_id) ?? "Compliance document",
  }));
}

// ---------------------------------------------------------------------------
// 5. Snapshot every line item; raise and route a request only where a partner
//    has to act. Automatic items are part of what the client bought, but the
//    platform handles them without one.
// ---------------------------------------------------------------------------

export async function snapshotAndRouteLineItems(
  admin: Admin,
  args: { clientId: string; clientPackageId: string; snapshots: Snapshot[] },
): Promise<void> {
  for (const snap of args.snapshots) {
    const { data: snapRow, error: snapErr } = await admin
      .from("client_package_line_items")
      .insert({
        client_package_id: args.clientPackageId,
        source_line_item_id: snap.source_line_item_id,
        name: snap.name,
        tier: snap.tier,
        unit_price: snap.unit_price,
        quantity: snap.quantity,
        fulfilment_mode: snap.fulfilment_mode,
      })
      .select("id")
      .single();
    if (snapErr || !snapRow) throw new Error(snapErr?.message ?? "Failed to snapshot line item");

    if (snap.fulfilment_mode !== "service_request") continue;

    const { data: request, error: reqErr } = await admin
      .from("service_requests")
      .insert({
        // reference is generated by the set_request_reference trigger; an
        // empty string signals "generate one" and satisfies the NOT NULL type.
        reference: "",
        origin: "system",
        client_id: args.clientId,
        service_id: snap.service_id,
        source_line_item_id: snapRow.id,
        title: snap.name,
      })
      .select("id")
      .single();
    if (reqErr || !request) throw new Error(reqErr?.message ?? "Failed to create request");

    await admin.rpc("route_request", { p_request_id: request.id });
  }
}

// ---------------------------------------------------------------------------
// 6. The compensating action
// ---------------------------------------------------------------------------

export type UploadedObject = { bucket: "artwork" | "documents"; path: string };

/**
 * Undo everything a failed onboarding created. Deleting the auth user only
 * nulls clients.primary_profile_id, so the client row and every uploaded
 * object have to be removed explicitly — and objects first, because they are
 * the one thing nothing else will ever reach again.
 */
export async function rollbackOnboarding(
  admin: Admin,
  args: { userId: string; clientId: string | null; uploaded: UploadedObject[] },
): Promise<void> {
  for (const object of args.uploaded) {
    await admin.storage.from(object.bucket).remove([object.path]);
  }
  if (args.clientId) {
    await admin.from("clients").delete().eq("id", args.clientId);
  }
  await admin.auth.admin.deleteUser(args.userId);
}
