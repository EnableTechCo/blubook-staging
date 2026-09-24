"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SIGN_UP_ERROR, SIGN_UP_UNAVAILABLE } from "@/features/auth/authMessages";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffRole } from "@/services/staffRole";
import { createClient } from "@/lib/supabase/server";
import { complianceReviewSchema, salesProfileReviewSchema } from "@/lib/validation/onboarding";
import { readProductWorkbook } from "@/features/products/productWorkbook";
import { fileIntoFolder, uploadArtwork, uploadIntakeDocument } from "@/features/onboarding/intakeUploads";
import { runOnboardingCheck } from "@/features/onboarding/onboardingCheck";
import { createComplianceRequest } from "@/features/onboarding/complianceRequest";
import { deliverDefaultDocuments } from "@/features/onboarding/defaultDocuments";
import {
  buildComplianceChecklist,
  intakeFileProblem,
  parseOnboardingForm,
  readIntakeFiles,
  recordWorkGroupIntake,
  resolvePackageAssembly,
  rollbackOnboarding,
  snapshotAndRouteLineItems,
  workGroupsForServices,
  type UploadedObject,
} from "@/features/onboarding/onboardClientSteps";
import { intakeProblem, parseIntakeAnswers } from "@/features/onboarding/intakeStages";
import { sendCredentialsEmail } from "@/lib/email/emailjs";
import { ROUTES } from "@/lib/routes";
import { claimInvitation, consumeInvitation, invitationForToken, releaseInvitation } from "@/features/onboarding/invitationTokens";
import { sendCredentialSetupEmail } from "@/features/onboarding/onboardingEmail";

export type OnboardState = { error: string } | undefined;
export type ComplianceReviewState = { error: string } | { ok: true } | undefined;

export type SalesProfileReviewState =
  | { error: string }
  | { ok: true; action: "save" | "changes_requested" | "approved"; profileVersion: number }
  | undefined;

const SALES_PROFILE_FIELDS = [
  "business_name",
  "registered_name",
  "trading_name",
  "entity_type",
  "registration_number",
  "industry",
  "vat_status",
  "vat_number",
  "primary_contact_job_title",
  "primary_contact_phone",
  "billing_contact_name",
  "billing_contact_email",
  "business_address_line_1",
  "business_address_line_2",
  "business_city",
  "business_province",
  "business_postal_code",
  "business_country",
  "billing_address_line_1",
  "billing_address_line_2",
  "billing_city",
  "billing_province",
  "billing_postal_code",
  "billing_country",
] as const;

export async function reviewOnboardingProfile(
  _previous: SalesProfileReviewState,
  formData: FormData,
): Promise<SalesProfileReviewState> {
  const denied = await requireStaffRole("sales_rep", "sales_admin");
  if (denied) return { error: denied };

  const parsed = salesProfileReviewSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid customer profile" };
  }

  const changes = Object.fromEntries(
    SALES_PROFILE_FIELDS.map((field) => [field, parsed.data[field]]),
  );
  const supabase = await createClient();
  const { data: profileVersion, error } = await supabase.rpc("review_onboarding_profile", {
    p_onboarding_id: parsed.data.onboardingId,
    p_action: parsed.data.reviewAction,
    p_expected_profile_version: parsed.data.expectedProfileVersion,
    p_changes: changes,
    p_note: parsed.data.note || null,
  });
  if (error) return { error: error.message };

  revalidatePath(ROUTES.onboardings);
  revalidatePath(ROUTES.customers);
  revalidatePath(ROUTES.notifications);
  revalidatePath(ROUTES.dashboard, "layout");
  return { ok: true, action: parsed.data.reviewAction, profileVersion };
}

// Staff reviews a received compliance document. The database function updates
// the checklist and creates the customer message and notification atomically.
export async function reviewComplianceDocument(
  _previous: ComplianceReviewState,
  formData: FormData,
): Promise<ComplianceReviewState> {
  const denied = await requireStaffRole("operations");
  if (denied) return { error: denied };

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

  revalidatePath(ROUTES.onboardings);
  revalidatePath(ROUTES.messages, "layout");
  revalidatePath(ROUTES.notifications);
  revalidatePath(ROUTES.dashboard, "layout");
  return { ok: true };
}

/**
 * Staff-driven onboarding: creates the client login, business account, an
 * onboarding case, a snapshotted package, the compliance checklist, and the
 * initial system service requests (routed).
 *
 * This function is the orchestrator: it fixes the order of the steps and owns
 * the rollback boundary. The steps themselves live in onboardClientSteps.ts,
 * where each takes the admin client as a parameter and is tested on its own.
 *
 * Authorization is checked against the caller's session; the work runs via the
 * admin client (bypassing RLS) only after that check passes. If any step after
 * account creation fails, everything created so far is removed so no orphaned
 * login, client row or uploaded object is left behind.
 */
export async function onboardClient(_prev: OnboardState, formData: FormData): Promise<OnboardState> {
  // This public account-creation action only accepts valid Sales-issued invites.
  const parsed = parseOnboardingForm(formData);
  if ("error" in parsed) return parsed;
  const input = parsed.input;

  // Both uploads are optional. Validate before creating the login so a bad file
  // does not leave an account to roll back.
  const files = readIntakeFiles(formData);
  const fileProblem = intakeFileProblem(files);
  if (fileProblem) return { error: fileProblem };

  const admin = createAdminClient();
  const inviteToken = String(formData.get("inviteToken") ?? "");
  const invitation = await invitationForToken(admin, inviteToken);
  if (!invitation || invitation.email !== input.email.trim().toLowerCase()) {
    return { error: "This invitation is invalid or expired. Ask your BluBook contact for a new link." };
  }
  const inviterId = invitation.invited_by;

  // Resolve the assembly before anything is created: it is a catalogue read,
  // and it decides which work groups' intake the submission had to answer.
  // Checking that here means a missing answer is refused with nothing to undo.
  let assembly: Awaited<ReturnType<typeof resolvePackageAssembly>>;
  let workGroups: Awaited<ReturnType<typeof workGroupsForServices>>;
  try {
    assembly = await resolvePackageAssembly(admin, input);
    workGroups = await workGroupsForServices(
      admin,
      assembly.snapshots.map((snapshot) => snapshot.service_id),
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not resolve the package." };
  }
  const intake = parseIntakeAnswers(formData);
  const intakeIssue = intakeProblem(intake, workGroups.map((group) => group.slug));
  if (intakeIssue) return { error: intakeIssue };
  const invitationId = await claimInvitation(admin, inviteToken, input.email);
  if (!invitationId) return { error: "This invitation is invalid, expired, or already used. Ask your BluBook contact for a new link." };
  const initialPassword = randomBytes(48).toString("base64url");
  let reviewNotificationBody: string | null = null;

  // 1) Create the client login. The signup trigger creates the profile.
  const created = await admin.auth.admin.createUser({
    email: input.email,
    password: initialPassword,
    email_confirm: true,
    user_metadata: { user_type: "client", full_name: input.fullName },
  });
  if (created.error || !created.data.user) {
    await releaseInvitation(admin, invitationId);
    return { error: SIGN_UP_ERROR };
  }
  const userId = created.data.user.id;

  // Everything from here to the catch is undone together on failure. Objects
  // uploaded before a later step fails would otherwise be left behind, since
  // deleting the auth user does not reach storage.
  const uploaded: UploadedObject[] = [];
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
        compliance_manager_name: input.complianceManagerName ?? null,
        compliance_manager_email: input.complianceManagerEmail ?? null,
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
    if (files.artwork) {
      uploaded.push({ bucket: "artwork", path: await uploadArtwork(admin, client.id, files.artwork) });
    }
    // The client's own product list, parsed into rows rather than filed as a
    // document: a quotation has to pick lines off it and total them, which an
    // attachment cannot do. Unreadable rows are skipped rather than failing the
    // onboarding — the list is maintained on the client's Sales tab afterwards,
    // which is where a correction belongs.
    if (files.productList) {
      const { products } = await readProductWorkbook(files.productList);
      if (products.length > 0) {
        await admin
          .from("client_products")
          .upsert(
            products.map((product) => ({ ...product, client_id: client.id, active: true })),
            { onConflict: "client_id,product_code" },
          );
      }
    }
    if (files.purchaseOrder) {
      const { documentId, path } = await uploadIntakeDocument(admin, {
        clientId: client.id,
        uploadedBy: inviterId,
        file: files.purchaseOrder,
        title: `Purchase order — ${input.tradingName}`,
        category: "other",
      });
      uploaded.push({ bucket: "documents", path });
      await fileIntoFolder(admin, { documentId, ownerProfileId: userId, slug: "purchase-orders" });
    }

    // 2b) What each work group asked to know, one document per group. Cascades
    //     away with the client row if a later step fails.
    await recordWorkGroupIntake(admin, {
      clientId: client.id,
      capturedBy: inviterId,
      groups: workGroups,
      answers: intake,
    });

    // 3) Onboarding case. The account is live, but onboarding remains open
    //    until every compliance document has been reviewed and verified.
    const { data: onboarding, error: onbErr } = await admin
      .from("onboardings")
      .insert({ client_id: client.id, sales_rep_id: null, status: "awaiting_documents", sales_review_status: "awaiting_review" })
      .select("id")
      .single();
    if (onbErr || !onboarding) throw new Error(onbErr?.message ?? "Failed to create onboarding");
    reviewNotificationBody = `Review profile from onboarding ${onboarding.id} (${input.tradingName}).`;
    const { data: salesStaff, error: salesStaffError } = await admin
      .from("profiles")
      .select("id")
      .eq("user_type", "staff")
      .eq("status", "active")
      .in("staff_role", ["sales_rep", "sales_admin", "admin"]);
    if (salesStaffError) throw new Error("Could not find the Sales review team");
    if (salesStaff.length > 0) {
      const { error: notificationError } = await admin.from("notifications").insert(
        salesStaff.map((staff) => ({
          recipient_id: staff.id,
          title: "Customer profile ready for review",
          body: reviewNotificationBody,
          type: "onboarding_review",
          urgent: false,
        })),
      );
      if (notificationError) throw new Error("Could not notify the Sales review team");
    }

    // 4) The assembly was resolved above, before the login existed. Standard
    //    uses the package's set price and its bundled items; Flex prices every
    //    selected line item individually.

    // 5) Assemble the client package (snapshot)
    const { data: clientPkg, error: cpErr } = await admin
      .from("client_packages")
      .insert({
        client_id: client.id,
        onboarding_id: onboarding.id,
        type: assembly.meta.type,
        source_package_id: assembly.basePackageId,
        tier: assembly.meta.tier,
        name: assembly.meta.name,
        total_price: assembly.meta.total_price,
        billing_interval: assembly.meta.billing_interval,
      })
      .select("id")
      .single();
    if (cpErr || !clientPkg) throw new Error(cpErr?.message ?? "Failed to create package");

    // 6) Compliance checklist from the active document types
    const complianceItems = await buildComplianceChecklist(admin, onboarding.id);

    // 7) Snapshot every line item; raise a routed request only for those a
    //    partner must act on.
    await snapshotAndRouteLineItems(admin, {
      clientId: client.id,
      clientPackageId: clientPkg.id,
      snapshots: assembly.snapshots,
    });

    // 8) Issue the default document pack. Each document becomes its own
    //    request that stays open until the client acknowledges receipt.
    //    Which documents apply depends on the package: BluBook's own go to
    //    everyone, a work group's only to clients who bought its services.
    const delivered = await deliverDefaultDocuments(admin, {
      clientId: client.id,
      clientProfileId: userId,
      staffProfileId: inviterId,
      serviceIds: assembly.snapshots.map((snapshot) => snapshot.service_id),
    });
    for (const document of delivered) {
      uploaded.push({ bucket: "documents", path: document.storagePath });
    }

    // 9) Welcome the client on its own thread, which puts BluBook in their
    //    inbox and closes immediately.
    await runOnboardingCheck(admin, {
      clientId: client.id,
      staffProfileId: inviterId,
      businessName: input.tradingName,
      deliveredCount: delivered.length,
    });

    // 10) Ask the client for its onboarding documents in a separate thread.
    //     The existing welcome message stays unchanged and appears first.
    await createComplianceRequest(admin, {
      onboardingId: onboarding.id,
      clientId: client.id,
      staffProfileId: inviterId,
      businessName: input.tradingName,
      items: complianceItems,
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) throw new Error("Missing app URL for credential setup");
    const { data: recovery, error: recoveryError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: input.email,
      options: { redirectTo: new URL("/auth/confirm?next=/set-password", appUrl).toString() },
    });
    if (recoveryError || !recovery.properties.action_link) throw new Error("Could not create credential setup link");
    const deliveredSetup = await sendCredentialSetupEmail(input.email, input.fullName, recovery.properties.action_link);
    if (deliveredSetup.status !== "sent") throw new Error("Could not deliver credential setup email");
    await consumeInvitation(admin, invitationId, client.id);
  } catch (e) {
    if (reviewNotificationBody) {
      const { error: cleanupError } = await admin.from("notifications").delete()
        .eq("title", "Customer profile ready for review")
        .eq("body", reviewNotificationBody);
      if (cleanupError) console.error("Could not remove failed onboarding review notifications", cleanupError.message);
    }
    await rollbackOnboarding(admin, { userId, clientId: createdClientId, uploaded });
    await releaseInvitation(admin, invitationId);
    console.error("Client signup provisioning failed", e);
    return { error: SIGN_UP_UNAVAILABLE };
  }

  revalidatePath(ROUTES.root, "layout");
  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.onboardings);
  redirect("/login?accountCreated=1");
}
