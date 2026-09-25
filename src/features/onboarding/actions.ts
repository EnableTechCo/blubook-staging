"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/services/profiles";
import { requireStaffRole } from "@/services/staffRole";
import { createClient } from "@/lib/supabase/server";
import { complianceReviewSchema } from "@/lib/validation/onboarding";
import { readProductWorkbook } from "@/features/products/productWorkbook";
import { fileIntoFolder, uploadArtwork, uploadIntakeDocument } from "@/features/onboarding/intakeUploads";
import { runOnboardingCheck } from "@/features/onboarding/onboardingCheck";
import { createComplianceRequest } from "@/features/onboarding/complianceRequest";
import { deliverDefaultDocuments } from "@/features/onboarding/defaultDocuments";
import {
  complianceChecklistFor,
  intakeFileProblem,
  notifyApprovers,
  parseOnboardingForm,
  readIntakeFiles,
  recordWorkGroupIntake,
  resolvePackageAssembly,
  rollbackOnboarding,
  workGroupsForServices,
  type UploadedObject,
} from "@/features/onboarding/onboardClientSteps";
import {
  INVITATION_PROBLEM,
  acceptInvitation,
  claimInvitation,
  findInvitation,
  releaseInvitation,
} from "@/features/onboarding/invitations";
import { intakeProblem, parseIntakeAnswers } from "@/features/onboarding/intakeStages";
import type { Json } from "@/types/database";
import { ROUTES } from "@/lib/routes";

export type OnboardState = { error: string } | undefined;
export type ApproveState = { error: string } | { ok: true; businessName: string; warning?: string } | undefined;
export type ComplianceReviewState = { error: string } | { ok: true } | undefined;

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

const SUBMISSION_FAILED =
  "Your details could not be saved just now. Nothing was created — please try again in a moment.";

/**
 * An invited client completes their onboarding.
 *
 * Nobody is signed in on this path. The invitation is the authority: its token
 * proves the link reached the invited inbox, which is why the login it creates
 * is confirmed straight away, and why that login's address is the invitation's
 * whatever the form says.
 *
 * What this creates is deliberately incomplete. The login, the business record
 * (pending), the intake answers and uploads, and an onboarding case holding the
 * package the client chose. No package is activated, no request is raised and
 * nothing reaches a partner until staff approve the case — see
 * approveOnboarding below.
 *
 * Everything is checked before the invitation is claimed and the login is
 * created, so a bad answer or a stale package is refused with nothing to undo.
 * If a step after that fails, everything created is removed and the invitation
 * is handed back, so the client can simply submit again.
 */
export async function completeOnboarding(_prev: OnboardState, formData: FormData): Promise<OnboardState> {
  // Accepting while signed in would swap that session for the new client's.
  if (await getCurrentProfile()) {
    return { error: "You are signed in to BluBook. Sign out, then open the invitation link again." };
  }

  const admin = createAdminClient();
  const lookup = await findInvitation(admin, String(formData.get("invitationToken") ?? ""));
  if ("problem" in lookup) return { error: INVITATION_PROBLEM[lookup.problem] };
  const invitation = lookup.invitation;

  formData.set("email", invitation.email);
  const parsed = parseOnboardingForm(formData);
  if ("error" in parsed) return parsed;
  const input = parsed.input;

  const files = readIntakeFiles(formData);
  const fileProblem = intakeFileProblem(files);
  if (fileProblem) return { error: fileProblem };

  // The package decides which work groups' questions had to be answered.
  let assembly: Awaited<ReturnType<typeof resolvePackageAssembly>>;
  let workGroups: Awaited<ReturnType<typeof workGroupsForServices>>;
  try {
    assembly = await resolvePackageAssembly(admin, input);
    workGroups = await workGroupsForServices(admin, assembly.snapshots.map((snapshot) => snapshot.service_id));
  } catch {
    return { error: "The package you chose is no longer available. Choose another and submit again." };
  }
  const intake = parseIntakeAnswers(formData);
  const intakeIssue = intakeProblem(intake, workGroups.map((group) => group.slug));
  if (intakeIssue) return { error: intakeIssue };

  if (!(await claimInvitation(admin, invitation.id))) return { error: INVITATION_PROBLEM.in_use };

  // 1) The login. The signup trigger creates the profile.
  const created = await admin.auth.admin.createUser({
    email: invitation.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { user_type: "client", full_name: input.fullName },
  });
  if (created.error || !created.data.user) {
    await releaseInvitation(admin, invitation.id);
    const exists =
      (created.error as { code?: string } | null)?.code === "email_exists" ||
      /already/i.test(created.error?.message ?? "");
    return {
      error: exists
        ? "An account already exists for this email address. Sign in instead, or ask BluBook for help."
        : SUBMISSION_FAILED,
    };
  }
  const userId = created.data.user.id;

  const uploaded: UploadedObject[] = [];
  let createdClientId: string | null = null;

  try {
    // 2) The business record, pending until approval.
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
        status: "pending",
      })
      .select("id")
      .single();
    if (clientErr || !client) throw new Error(clientErr?.message ?? "Failed to create client");
    createdClientId = client.id;

    // 3) What the client uploaded. Artwork is their profile picture; the
    //    product list becomes rows a quotation can pick from; the purchase
    //    order is a record filed in their archive.
    if (files.artwork) {
      uploaded.push({ bucket: "artwork", path: await uploadArtwork(admin, client.id, files.artwork) });
    }
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
        uploadedBy: userId,
        file: files.purchaseOrder,
        title: `Purchase order — ${input.tradingName}`,
        category: "other",
      });
      uploaded.push({ bucket: "documents", path });
      await fileIntoFolder(admin, { documentId, ownerProfileId: userId, slug: "purchase-orders" });
    }

    // 4) What each work group asked to know.
    await recordWorkGroupIntake(admin, {
      clientId: client.id,
      capturedBy: userId,
      groups: workGroups,
      answers: intake,
    });

    // 5) The case staff will approve, carrying the package the client chose.
    //    The inviter is its sales rep, so the client stays attributed.
    const { error: onbErr } = await admin.from("onboardings").insert({
      client_id: client.id,
      sales_rep_id: invitation.invited_by,
      status: "in_progress",
      submitted_at: new Date().toISOString(),
      requested_package: assembly as unknown as Json,
    });
    if (onbErr) throw new Error(onbErr.message);

    // 6) Close the invitation against the client it created.
    await acceptInvitation(admin, invitation.id, client.id);
  } catch (e) {
    await rollbackOnboarding(admin, { userId, clientId: createdClientId, uploaded });
    await releaseInvitation(admin, invitation.id);
    console.error("Invited onboarding failed", e);
    return { error: SUBMISSION_FAILED };
  }

  // After the boundary: the submission is complete, and a missed notification
  // must not undo it. The case is on the queue either way.
  await notifyApprovers(admin, input.tradingName).catch((e) => console.error("Approver notification failed", e));

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password: input.password,
  });

  revalidatePath(ROUTES.onboardings);
  revalidatePath(ROUTES.customers);
  redirect(signInError ? "/login/client" : "/dashboard");
}

const approvalResultSchema = z.object({
  client_id: z.string().uuid(),
  client_profile_id: z.string().uuid(),
  business_name: z.string(),
  service_ids: z.array(z.string().uuid()),
});

/**
 * Staff approve a submitted client, and it goes live.
 *
 * The database does the part that must happen together: it activates the
 * client, snapshots the package, raises and routes the initial requests and
 * opens the compliance checklist, in one transaction, and refuses a second
 * approval. The authority is checked there too; the check here is so a refusal
 * reads well.
 *
 * What follows is delivered afterwards: the default document pack, the welcome
 * thread and the compliance request thread. The client is already live by
 * then, so a failure is reported to staff rather than undone.
 */
export async function approveOnboarding(_prev: ApproveState, formData: FormData): Promise<ApproveState> {
  const staff = await getCurrentProfile();
  const denied = await requireStaffRole("operations", "sales_admin");
  if (denied || !staff) return { error: denied ?? "Not authenticated." };

  const onboardingId = z.string().uuid().safeParse(formData.get("onboardingId"));
  if (!onboardingId.success) return { error: "Invalid onboarding case." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_client_onboarding", {
    p_onboarding_id: onboardingId.data,
  });
  if (error) return { error: error.message };

  const result = approvalResultSchema.safeParse(data);
  revalidatePath(ROUTES.onboardings);
  revalidatePath(ROUTES.customers);
  revalidatePath(ROUTES.dashboard, "layout");
  if (!result.success) {
    return { ok: true, businessName: "The client", warning: "Approved, but the welcome pack could not be prepared." };
  }
  const approved = result.data;

  const admin = createAdminClient();
  try {
    const delivered = await deliverDefaultDocuments(admin, {
      clientId: approved.client_id,
      clientProfileId: approved.client_profile_id,
      staffProfileId: staff.id,
      serviceIds: approved.service_ids,
    });
    await runOnboardingCheck(admin, {
      clientId: approved.client_id,
      staffProfileId: staff.id,
      businessName: approved.business_name,
      deliveredCount: delivered.length,
    });
    await createComplianceRequest(admin, {
      onboardingId: onboardingId.data,
      clientId: approved.client_id,
      staffProfileId: staff.id,
      businessName: approved.business_name,
      items: await complianceChecklistFor(admin, onboardingId.data),
    });
  } catch (e) {
    console.error("Post-approval delivery failed", e);
    return {
      ok: true,
      businessName: approved.business_name,
      warning:
        "The client is live and its requests are routed, but the welcome pack or compliance request could not be sent. The reason is in the server log; tell the platform team before the client signs in.",
    };
  }

  return { ok: true, businessName: approved.business_name };
}
