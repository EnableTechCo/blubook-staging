import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { clientOnboardingSchema, type ClientOnboardingInput } from "@/lib/validation/onboarding";
import { productFileError } from "@/features/products/productWorkbook";
import { artworkError, documentError, optionalFile } from "@/features/onboarding/intakeUploads";

/**
 * The steps of an invited client's submission, each on its own.
 *
 * Each step takes the admin client as a parameter rather than creating one, so
 * a test hands in a fake and asserts what was written where. The action in
 * actions.ts is the orchestrator: it decides the order and owns the rollback
 * boundary; these functions own the work.
 *
 * What is not here is deliberate. Snapshotting the package, raising and
 * routing requests and opening the compliance checklist happen at approval,
 * inside approve_client_onboarding() in the database, where they succeed or
 * fail together. The submission only records what the client chose.
 *
 * Not a "use server" module on purpose. That directive exports every function
 * as a server action reachable from the client; these are internals.
 */

export type Admin = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// 1. The form
// ---------------------------------------------------------------------------

type ParsedOnboarding = { input: ClientOnboardingInput } | { error: string };

export function parseOnboardingForm(formData: FormData): ParsedOnboarding {
  let lineItemIds: unknown = [];
  try {
    lineItemIds = JSON.parse((formData.get("lineItemIds") as string) || "[]");
  } catch {
    return { error: "Invalid package selection." };
  }

  const parsed = clientOnboardingSchema.safeParse({
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
    complianceManagerName: formData.get("complianceManagerName"),
    complianceManagerEmail: formData.get("complianceManagerEmail"),
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
    password: formData.get("password"),
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

/**
 * What the client chose, resolved against the catalogue. Stored on the
 * onboarding case as requested_package and activated as-is at approval, so the
 * package the client saw is the package they get.
 */
export interface PackageAssembly {
  basePackageId: string;
  meta: PackageMeta;
  snapshots: Snapshot[];
}

/**
 * Active records only. The invite page lists nothing else, but the ids arrive
 * from the browser, so a retired package or line item posted by hand must be
 * refused here rather than activated.
 */
export async function resolvePackageAssembly(
  admin: Admin,
  input: Pick<ClientOnboardingInput, "packageMode" | "packageId" | "lineItemIds">,
): Promise<PackageAssembly> {
  const { data: basePkg, error: pkgErr } = await admin
    .from("packages")
    .select("id,name,tier,price,billing_interval")
    .eq("id", input.packageId)
    .eq("active", true)
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
    .eq("active", true)
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
// 4. The compliance checklist approval opened, named for the request thread
// ---------------------------------------------------------------------------

/**
 * approve_client_onboarding() creates one checklist row per active document
 * type. The compliance request thread lists them by name, so this reads them
 * back in the order the types were created.
 */
export async function complianceChecklistFor(
  admin: Admin,
  onboardingId: string,
): Promise<{ id: string; name: string }[]> {
  const { data, error } = await admin
    .from("onboarding_documents")
    .select("id,created_at,compliance_document_types(name)")
    .eq("onboarding_id", onboardingId)
    .order("created_at")
    .returns<{ id: string; created_at: string; compliance_document_types: { name: string } | null }[]>();
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.compliance_document_types?.name ?? "Compliance document",
  }));
}

// ---------------------------------------------------------------------------
// 5b. The work groups a set of services belongs to, and the intake each asked for
// ---------------------------------------------------------------------------

export type WorkGroupRef = { id: string; slug: string };

/**
 * The distinct work groups behind a set of services. Decides which intake
 * stages the submission had to answer — resolved here, from the catalogue,
 * rather than trusted from the form.
 */
export async function workGroupsForServices(
  admin: Admin,
  serviceIds: readonly string[],
): Promise<WorkGroupRef[]> {
  const ids = [...new Set(serviceIds)];
  if (ids.length === 0) return [];

  const { data, error } = await admin
    .from("services")
    .select("id,service_groups(id,slug)")
    .in("id", ids)
    .returns<{ id: string; service_groups: WorkGroupRef | null }[]>();
  if (error) throw new Error(error.message);

  const groups = new Map<string, WorkGroupRef>();
  for (const service of data ?? []) {
    if (service.service_groups) groups.set(service.service_groups.id, service.service_groups);
  }
  return [...groups.values()];
}

/**
 * Stores one intake document per work group that had answers. Groups the
 * package does not draw on are not written even if the form carried answers
 * for them — the caller passes only the applicable groups.
 */
export async function recordWorkGroupIntake(
  admin: Admin,
  args: {
    clientId: string;
    capturedBy: string;
    groups: readonly WorkGroupRef[];
    answers: Record<string, Record<string, string>>;
  },
): Promise<void> {
  const rows = args.groups
    .filter((group) => Object.keys(args.answers[group.slug] ?? {}).length > 0)
    .map((group) => ({
      client_id: args.clientId,
      service_group_id: group.id,
      answers: args.answers[group.slug],
      captured_by: args.capturedBy,
    }));
  if (rows.length === 0) return;

  const { error } = await admin.from("client_work_group_intake").insert(rows);
  if (error) throw new Error(error.message);
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

// ---------------------------------------------------------------------------
// 7. Tell the people who can approve
// ---------------------------------------------------------------------------

/**
 * A notification for every active staff member who can approve a client:
 * operations, sales admin, and admin, who passes every role check. Runs after
 * the submission is complete, so a failure here is reported to the logs and
 * never undoes the client's work.
 */
export async function notifyApprovers(admin: Admin, businessName: string): Promise<number> {
  const { data: approvers, error } = await admin
    .from("profiles")
    .select("id")
    .eq("user_type", "staff")
    .eq("status", "active")
    .in("staff_role", ["operations", "sales_admin", "admin"]);
  if (error) throw new Error(error.message);
  if (!approvers || approvers.length === 0) return 0;

  const { error: insertError } = await admin.from("notifications").insert(
    approvers.map((approver) => ({
      recipient_id: approver.id,
      type: "onboarding_review" as const,
      // Urgent, because the bell rings only for urgent notifications and a
      // client waiting to go live is what an approver most needs to see.
      urgent: true,
      title: "New client ready for approval",
      body: `${businessName} has completed onboarding and is waiting for approval before going live.`,
    })),
  );
  if (insertError) throw new Error(insertError.message);
  return approvers.length;
}
