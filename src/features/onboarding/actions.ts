"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/services/profiles";
import { createClient } from "@/lib/supabase/server";
import { complianceReviewSchema, onboardClientSchema } from "@/lib/validation/onboarding";
import {
  artworkError,
  documentError,
  fileIntoFolder,
  optionalFile,
  uploadArtwork,
  uploadIntakeDocument,
} from "@/features/onboarding/intakeUploads";
import { runOnboardingCheck } from "@/features/onboarding/onboardingCheck";
import { createComplianceRequest } from "@/features/onboarding/complianceRequest";
import { deliverDefaultDocuments } from "@/features/onboarding/defaultDocuments";
import { sendCredentialsEmail } from "@/lib/email/emailjs";

export type OnboardState = { error: string } | undefined;
export type ComplianceReviewState = { error: string } | { ok: true } | undefined;

// Staff reviews a received compliance document. The database function updates
// the checklist and creates the customer message and notification atomically.
export async function reviewComplianceDocument(
  _previous: ComplianceReviewState,
  formData: FormData,
): Promise<ComplianceReviewState> {
  const staff = await getCurrentProfile();
  if (!staff || staff.user_type !== "staff") return { error: "Only staff can review documents" };

  const parsed = complianceReviewSchema.safeParse({
    documentId: formData.get("documentId"),
    decision: formData.get("decision"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid review" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_onboarding_document", {
    p_document_id: parsed.data.documentId,
    p_decision: parsed.data.decision,
    p_message: parsed.data.message,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/onboardings");
  revalidatePath("/dashboard/messages", "layout");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard", "layout");
  return { ok: true };
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
  const input = parsed.data;

  // Both uploads are optional. Validate before creating the login so a bad file
  // does not leave an account to roll back.
  const artwork = optionalFile(formData.get("artwork"));
  const purchaseOrder = optionalFile(formData.get("purchaseOrder"));
  const fileProblem =
    (artwork && artworkError(artwork)) || (purchaseOrder && documentError(purchaseOrder)) || null;
  if (fileProblem) return { error: fileProblem };

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
  // Objects uploaded before a later step fails would otherwise be left behind,
  // since deleting the auth user does not reach storage.
  const uploaded: { bucket: "artwork" | "documents"; path: string }[] = [];
  let createdClientId: string | null = null;

  try {
    // 2) Business account
    const { data: client, error: clientErr } = await admin
      .from("clients")
      .insert({
        business_name: input.tradingName,
        registered_name: input.registeredName,
        trading_name: input.tradingName,
        entity_type: input.entityType,
        registration_number: input.registrationNumber || null,
        industry: input.industry,
        primary_contact_job_title: input.jobTitle,
        primary_contact_phone: input.telephone,
        billing_contact_name: input.billingContactName,
        billing_contact_email: input.billingContactEmail,
        business_address_line_1: input.businessAddressLine1,
        business_address_line_2: input.businessAddressLine2 || null,
        business_city: input.businessCity,
        business_province: input.businessProvince,
        business_postal_code: input.businessPostalCode,
        business_country: input.businessCountry,
        billing_address_line_1: input.billingAddressLine1,
        billing_address_line_2: input.billingAddressLine2 || null,
        billing_city: input.billingCity,
        billing_province: input.billingProvince,
        billing_postal_code: input.billingPostalCode,
        billing_country: input.billingCountry,
        vat_status: input.vatStatus,
        vat_number: input.vatStatus === "registered" ? input.vatNumber : null,
        primary_profile_id: userId,
        status: "active",
      })
      .select("id")
      .single();
    if (clientErr || !client) throw new Error(clientErr?.message ?? "Failed to create client");
    createdClientId = client.id;

    // 2a) Intake uploads. Artwork is the client's profile picture; the purchase
    //     order is a record, so it becomes a document filed in their archive.
    if (artwork) {
      uploaded.push({ bucket: "artwork", path: await uploadArtwork(admin, client.id, artwork) });
    }
    if (purchaseOrder) {
      const { documentId, path } = await uploadIntakeDocument(admin, {
        clientId: client.id,
        uploadedBy: staff.id,
        file: purchaseOrder,
        title: `Purchase order — ${input.tradingName}`,
        category: "other",
      });
      uploaded.push({ bucket: "documents", path });
      await fileIntoFolder(admin, {
        documentId,
        ownerProfileId: userId,
        slug: "purchase-orders",
      });
    }

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
      fulfilment_mode: "service_request" | "automatic";
    };
    type Snapshot = {
      source_line_item_id: string;
      name: string;
      tier: LineItem["tier"];
      unit_price: number;
      quantity: number;
      service_id: string;
      fulfilment_mode: LineItem["fulfilment_mode"];
    };

    const { data: basePkg, error: pkgErr } = await admin
      .from("packages")
      .select("id,name,tier,price,billing_interval")
      .eq("id", input.packageId)
      .single();
    if (pkgErr || !basePkg) throw new Error("Selected package not found");

    let pkgMeta: {
      type: "standard" | "flex";
      tier: LineItem["tier"] | null;
      name: string;
      total_price: number;
      // Standard packages carry the source package's term; Flex is assembled
      // from individually priced items and has none.
      billing_interval: "monthly" | "quarterly" | "annual" | "one_time" | null;
    };
    let snapshots: Snapshot[];

    if (input.packageMode === "standard") {
      const { data: pkgItems, error: itemsErr } = await admin
        .from("package_line_items")
        .select("quantity,line_items(id,name,tier,price,service_id,fulfilment_mode)")
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
          fulfilment_mode: it.line_items!.fulfilment_mode,
        }));
      pkgMeta = {
        type: "standard",
        tier: basePkg.tier,
        name: basePkg.name,
        total_price: basePkg.price,
        billing_interval: basePkg.billing_interval,
      };
    } else {
      const { data: items, error: liErr } = await admin
        .from("line_items")
        .select("id,name,tier,price,service_id,fulfilment_mode")
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
        fulfilment_mode: li.fulfilment_mode,
      }));
      const total = snapshots.reduce((sum, s) => sum + Number(s.unit_price) * s.quantity, 0);
      pkgMeta = {
        type: "flex",
        tier: null,
        name: `${basePkg.name} (Flex)`,
        total_price: total,
        billing_interval: null,
      };
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
        billing_interval: pkgMeta.billing_interval,
      })
      .select("id")
      .single();
    if (cpErr || !clientPkg) throw new Error(cpErr?.message ?? "Failed to create package");
    const clientPackageId = clientPkg.id;

    // 6) Compliance checklist from the active document types
    const { data: docTypes } = await admin
      .from("compliance_document_types")
      .select("id,name")
      .eq("active", true);
    let complianceItems: { id: string; name: string }[] = [];
    if (docTypes && docTypes.length > 0) {
      const { data: insertedDocuments, error: complianceError } = await admin
        .from("onboarding_documents")
        .insert(docTypes.map((d) => ({ onboarding_id: onboarding.id, document_type_id: d.id })))
        .select("id,document_type_id");
      if (complianceError) throw new Error(complianceError.message);
      const names = new Map(docTypes.map((documentType) => [documentType.id, documentType.name]));
      complianceItems = (insertedDocuments ?? []).map((document) => ({
        id: document.id,
        name: names.get(document.document_type_id) ?? "Compliance document",
      }));
    }

    // 7) Snapshot every line item, then raise a routed request only for those
    //    actioned by a service request. Automatic items are part of what the
    //    client bought, but the platform handles them without a partner.
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

    // 8) Issue the default document pack. Each document becomes its own
    //    request that stays open until the client acknowledges receipt.
    //    Which documents apply depends on the package: BluBook's own go to
    //    everyone, a work group's only to clients who bought its services.
    const delivered = await deliverDefaultDocuments(admin, {
      clientId: client.id,
      clientProfileId: userId,
      staffProfileId: staff.id,
      serviceIds: snapshots.map((snapshot) => snapshot.service_id),
    });
    for (const document of delivered) {
      uploaded.push({ bucket: "documents", path: document.storagePath });
    }

    // 9) Welcome the client on its own thread, which puts BluBook in their
    //    inbox and closes immediately.
    await runOnboardingCheck(admin, {
      clientId: client.id,
      staffProfileId: staff.id,
      businessName: input.tradingName,
      deliveredCount: delivered.length,
    });

    // 10) Ask the client for its onboarding documents in a separate thread.
    //     The existing welcome message stays unchanged and appears first.
    await createComplianceRequest(admin, {
      onboardingId: onboarding.id,
      clientId: client.id,
      staffProfileId: staff.id,
      businessName: input.tradingName,
      items: complianceItems,
    });
  } catch (e) {
    // Roll back everything created so far. Deleting the auth user only nulls
    // clients.primary_profile_id, so the client row and any uploaded objects
    // have to be removed explicitly.
    for (const object of uploaded) {
      await admin.storage.from(object.bucket).remove([object.path]);
    }
    if (createdClientId) {
      await admin.from("clients").delete().eq("id", createdClientId);
    }
    await admin.auth.admin.deleteUser(userId);
    return { error: e instanceof Error ? e.message : "Onboarding failed." };
  }

  // The credentials email is the one part of onboarding that leaves the
  // platform. It runs after the rollback boundary on purpose: the account is
  // live and usable by now, so a mail failure must not undo it — but staff have
  // to know, since the client cannot sign in without the password.
  const email = await sendCredentialsEmail({
    toEmail: input.email,
    toName: input.fullName,
    businessName: input.tradingName,
    tempPassword: input.tempPassword,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/login/client`,
  });

  const reason = email.status === "sent" ? "" : `&emailReason=${encodeURIComponent(email.reason)}`;

  revalidatePath("/dashboard");
  redirect(
    `/dashboard?onboarded=${encodeURIComponent(input.tradingName)}&email=${email.status}${reason}`,
  );
}
