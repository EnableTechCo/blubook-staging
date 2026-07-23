"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/services/profiles";
import { createClient } from "@/lib/supabase/server";
import { complianceUpdateSchema, onboardClientSchema } from "@/lib/validation/onboarding";

export type OnboardState = { error: string } | undefined;

// Staff update a compliance document's status on an onboarding checklist.
// Staff RLS on onboarding_documents permits the write, so the session client is
// enough (no admin needed).
export async function updateComplianceStatus(formData: FormData): Promise<void> {
  const staff = await getCurrentProfile();
  if (!staff || staff.user_type !== "staff") return;

  const parsed = complianceUpdateSchema.safeParse({
    documentId: formData.get("documentId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("onboarding_documents")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.documentId);

  revalidatePath("/dashboard/onboardings");
}

// Staff-driven onboarding: creates the client login, business account, an
// onboarding case, a snapshotted standard package, the compliance checklist,
// and the initial system service requests (routed). Authorization is checked
// against the caller's session; the work runs via the admin client (bypassing
// RLS) only after that check passes. If any step after account creation fails,
// the new auth user is removed so no orphaned login is left behind.
export async function onboardClient(_prev: OnboardState, formData: FormData): Promise<OnboardState> {
  const staff = await getCurrentProfile();
  if (!staff || staff.user_type !== "staff") {
    return { error: "Only staff can onboard clients." };
  }

  let lineItemIds: unknown = [];
  try {
    lineItemIds = JSON.parse((formData.get("lineItemIds") as string) || "[]");
  } catch {
    return { error: "Invalid package selection." };
  }

  const parsed = onboardClientSchema.safeParse({
    businessName: formData.get("businessName"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    tempPassword: formData.get("tempPassword"),
    packageMode: formData.get("packageMode"),
    packageId: formData.get("packageId"),
    lineItemIds,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

  const admin = createAdminClient();

  // 1) Create the client login. The signup trigger creates the profile.
  const created = await admin.auth.admin.createUser({
    email: input.email,
    password: input.tempPassword,
    email_confirm: true,
    user_metadata: { user_type: "client", full_name: input.fullName },
  });
  if (created.error || !created.data.user) {
    return { error: created.error?.message ?? "Could not create the client account." };
  }
  const userId = created.data.user.id;

  try {
    // 2) Business account
    const { data: client, error: clientErr } = await admin
      .from("clients")
      .insert({ business_name: input.businessName, primary_profile_id: userId, status: "active" })
      .select("id")
      .single();
    if (clientErr || !client) throw new Error(clientErr?.message ?? "Failed to create client");

    // 3) Onboarding case (completed — account is live)
    const { data: onboarding, error: onbErr } = await admin
      .from("onboardings")
      .insert({ client_id: client.id, sales_rep_id: staff.id, status: "completed", completed_at: new Date().toISOString() })
      .select("id")
      .single();
    if (onbErr || !onboarding) throw new Error(onbErr?.message ?? "Failed to create onboarding");

    // 4) Resolve the assembly. Standard uses the package's set price and its
    //    bundled items; Flex prices every selected line item individually.
    type LineItem = {
      id: string;
      name: string;
      tier: "basic" | "intermediate" | "professional";
      price: number;
      service_id: string;
    };
    type Snapshot = { source_line_item_id: string; name: string; tier: LineItem["tier"]; unit_price: number; quantity: number; service_id: string };

    const { data: basePkg, error: pkgErr } = await admin
      .from("packages")
      .select("id,name,tier,price")
      .eq("id", input.packageId)
      .single();
    if (pkgErr || !basePkg) throw new Error("Selected package not found");

    let pkgMeta: { type: "standard" | "flex"; tier: LineItem["tier"] | null; name: string; total_price: number };
    let snapshots: Snapshot[];

    if (input.packageMode === "standard") {
      const { data: pkgItems, error: itemsErr } = await admin
        .from("package_line_items")
        .select("quantity,line_items(id,name,tier,price,service_id)")
        .eq("package_id", basePkg.id)
        .returns<{ quantity: number; line_items: LineItem | null }[]>();
      if (itemsErr) throw new Error(itemsErr.message);
      snapshots = (pkgItems ?? [])
        .filter((it) => it.line_items)
        .map((it) => ({
          source_line_item_id: it.line_items!.id,
          name: it.line_items!.name,
          tier: it.line_items!.tier,
          unit_price: it.line_items!.price,
          quantity: it.quantity,
          service_id: it.line_items!.service_id,
        }));
      pkgMeta = { type: "standard", tier: basePkg.tier, name: basePkg.name, total_price: basePkg.price };
    } else {
      const { data: items, error: liErr } = await admin
        .from("line_items")
        .select("id,name,tier,price,service_id")
        .in("id", input.lineItemIds)
        .returns<LineItem[]>();
      if (liErr) throw new Error(liErr.message);
      if (!items || items.length === 0) throw new Error("No line items selected for the flex package");
      snapshots = items.map((li) => ({
        source_line_item_id: li.id,
        name: li.name,
        tier: li.tier,
        unit_price: li.price,
        quantity: 1,
        service_id: li.service_id,
      }));
      const total = snapshots.reduce((sum, s) => sum + Number(s.unit_price) * s.quantity, 0);
      pkgMeta = { type: "flex", tier: null, name: `${basePkg.name} (Flex)`, total_price: total };
    }

    // 5) Assemble the client package (snapshot)
    const { data: clientPkg, error: cpErr } = await admin
      .from("client_packages")
      .insert({
        client_id: client.id,
        onboarding_id: onboarding.id,
        type: pkgMeta.type,
        source_package_id: basePkg.id,
        tier: pkgMeta.tier,
        name: pkgMeta.name,
        total_price: pkgMeta.total_price,
      })
      .select("id")
      .single();
    if (cpErr || !clientPkg) throw new Error(cpErr?.message ?? "Failed to create package");
    const clientPackageId = clientPkg.id;

    // 6) Compliance checklist from the active document types
    const { data: docTypes } = await admin
      .from("compliance_document_types")
      .select("id")
      .eq("active", true);
    if (docTypes && docTypes.length > 0) {
      await admin.from("onboarding_documents").insert(
        docTypes.map((d) => ({ onboarding_id: onboarding.id, document_type_id: d.id })),
      );
    }

    // 7) Generate a system request per snapshot line item, then route each.
    for (const snap of snapshots) {
      const { data: snapRow, error: snapErr } = await admin
        .from("client_package_line_items")
        .insert({
          client_package_id: clientPackageId,
          source_line_item_id: snap.source_line_item_id,
          name: snap.name,
          tier: snap.tier,
          unit_price: snap.unit_price,
          quantity: snap.quantity,
        })
        .select("id")
        .single();
      if (snapErr || !snapRow) throw new Error(snapErr?.message ?? "Failed to snapshot line item");

      const { data: request, error: reqErr } = await admin
        .from("service_requests")
        .insert({
          // reference is generated by the set_request_reference trigger; an
          // empty string signals "generate one" and satisfies the NOT NULL type.
          reference: "",
          origin: "system",
          client_id: client.id,
          service_id: snap.service_id,
          source_line_item_id: snapRow.id,
          title: snap.name,
        })
        .select("id")
        .single();
      if (reqErr || !request) throw new Error(reqErr?.message ?? "Failed to create request");

      await admin.rpc("route_request", { p_request_id: request.id });
    }
  } catch (e) {
    // Roll back the account so we don't leave an orphaned login.
    await admin.auth.admin.deleteUser(userId);
    return { error: e instanceof Error ? e.message : "Onboarding failed." };
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard?onboarded=${encodeURIComponent(input.businessName)}`);
}
