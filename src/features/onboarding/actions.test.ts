import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseFake } from "../../../tests/stubs/supabaseFake";

const mocks = vi.hoisted(() => ({
  getCurrentProfile: vi.fn(),
  requireStaffRole: vi.fn(),
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`);
  }),
  findInvitation: vi.fn(),
  claimInvitation: vi.fn(),
  releaseInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
  resolvePackageAssembly: vi.fn(),
  workGroupsForServices: vi.fn(),
  recordWorkGroupIntake: vi.fn(),
  rollbackOnboarding: vi.fn(),
  notifyApprovers: vi.fn(),
  complianceChecklistFor: vi.fn(),
  deliverDefaultDocuments: vi.fn(),
  runOnboardingCheck: vi.fn(),
  createComplianceRequest: vi.fn(),
}));

vi.mock("@/services/profiles", () => ({ getCurrentProfile: mocks.getCurrentProfile }));
vi.mock("@/services/staffRole", () => ({ requireStaffRole: mocks.requireStaffRole }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/features/onboarding/invitations", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/onboarding/invitations")>()),
  findInvitation: mocks.findInvitation,
  claimInvitation: mocks.claimInvitation,
  releaseInvitation: mocks.releaseInvitation,
  acceptInvitation: mocks.acceptInvitation,
}));
vi.mock("@/features/onboarding/onboardClientSteps", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/onboarding/onboardClientSteps")>()),
  resolvePackageAssembly: mocks.resolvePackageAssembly,
  workGroupsForServices: mocks.workGroupsForServices,
  recordWorkGroupIntake: mocks.recordWorkGroupIntake,
  rollbackOnboarding: mocks.rollbackOnboarding,
  notifyApprovers: mocks.notifyApprovers,
  complianceChecklistFor: mocks.complianceChecklistFor,
}));
vi.mock("@/features/onboarding/defaultDocuments", () => ({ deliverDefaultDocuments: mocks.deliverDefaultDocuments }));
vi.mock("@/features/onboarding/onboardingCheck", () => ({ runOnboardingCheck: mocks.runOnboardingCheck }));
vi.mock("@/features/onboarding/complianceRequest", () => ({ createComplianceRequest: mocks.createComplianceRequest }));

import { approveOnboarding, completeOnboarding } from "@/features/onboarding/actions";
import { INVITATION_PROBLEM } from "@/features/onboarding/invitations";

// The two actions the rewrite rests on. completeOnboarding runs for someone
// who is not signed in, so the invitation is its authority; approveOnboarding
// is the one step that makes a client live.

const PACKAGE_ID = "22222222-2222-4222-8222-222222222222";
const ONBOARDING_ID = "33333333-3333-4333-8333-333333333333";
const INVITATION = { id: "inv-1", email: "invited@ridge.test", business_name: "Ridge", invited_by: "staff-inviter" };
const ASSEMBLY = {
  basePackageId: PACKAGE_ID,
  meta: { type: "standard", tier: "basic", name: "Starter", total_price: 1500, billing_interval: "monthly" },
  snapshots: [{ source_line_item_id: "li-1", name: "Bookkeeping", tier: "basic", unit_price: 100, quantity: 1, service_id: "svc-1", fulfilment_mode: "service_request" }],
};

function onboardingForm(overrides: Record<string, string> = {}) {
  const fields: Record<string, string> = {
    invitationToken: "a".repeat(43),
    registeredName: "Ridge Foods (Pty) Ltd",
    tradingName: "Ridge Foods",
    entityType: "sole_proprietor",
    registrationNumber: "",
    industry: "Hospitality",
    fullName: "Naledi Dlamini",
    jobTitle: "Owner",
    // Whatever the form says, the login is the invitation's address.
    email: "someone-else@attacker.test",
    telephone: "0110000000",
    billingContactName: "Naledi Dlamini",
    billingContactEmail: "invited@ridge.test",
    complianceManagerName: "",
    complianceManagerEmail: "",
    businessAddressLine1: "1 Main Rd",
    businessAddressLine2: "",
    businessCity: "Sandton",
    businessProvince: "Gauteng",
    businessPostalCode: "2196",
    businessCountry: "South Africa",
    billingAddressLine1: "1 Main Rd",
    billingAddressLine2: "",
    billingCity: "Sandton",
    billingProvince: "Gauteng",
    billingPostalCode: "2196",
    billingCountry: "South Africa",
    vatStatus: "not_registered",
    vatNumber: "",
    password: "a-good-password",
    packageMode: "standard",
    packageId: PACKAGE_ID,
    lineItemIds: "[]",
    ...overrides,
  };
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

let admin: ReturnType<typeof makeSupabaseFake>;
let session: ReturnType<typeof makeSupabaseFake>;

beforeEach(() => {
  vi.clearAllMocks();
  admin = makeSupabaseFake({ clients: [{ data: { id: "cli-1" } }], onboardings: [{ data: null }] });
  session = makeSupabaseFake();
  mocks.createAdminClient.mockReturnValue(admin.client);
  mocks.createClient.mockResolvedValue(session.client);
  mocks.getCurrentProfile.mockResolvedValue(null);
  mocks.findInvitation.mockResolvedValue({ invitation: INVITATION });
  mocks.claimInvitation.mockResolvedValue(true);
  mocks.resolvePackageAssembly.mockResolvedValue(ASSEMBLY);
  mocks.workGroupsForServices.mockResolvedValue([]);
  mocks.notifyApprovers.mockResolvedValue(2);
});

describe("completeOnboarding", () => {
  it("refuses a visitor who is already signed in, before looking at the invitation", async () => {
    mocks.getCurrentProfile.mockResolvedValue({ id: "someone", user_type: "staff" });
    const out = await completeOnboarding(undefined, onboardingForm());
    expect(out).toEqual({ error: "You are signed in to BluBook. Sign out, then open the invitation link again." });
    expect(mocks.findInvitation).not.toHaveBeenCalled();
  });

  it("explains a link that no longer works, and creates nothing", async () => {
    mocks.findInvitation.mockResolvedValue({ problem: "expired" });
    expect(await completeOnboarding(undefined, onboardingForm())).toEqual({ error: INVITATION_PROBLEM.expired });
    expect(admin.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("refuses a package that is no longer available before claiming anything", async () => {
    mocks.resolvePackageAssembly.mockRejectedValue(new Error("Selected package not found"));
    const out = await completeOnboarding(undefined, onboardingForm());
    expect(out).toEqual({ error: "The package you chose is no longer available. Choose another and submit again." });
    expect(mocks.claimInvitation).not.toHaveBeenCalled();
  });

  it("loses gracefully to another tab submitting the same link", async () => {
    mocks.claimInvitation.mockResolvedValue(false);
    expect(await completeOnboarding(undefined, onboardingForm())).toEqual({ error: INVITATION_PROBLEM.in_use });
    expect(admin.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("points an existing account to sign-in, and hands the invitation back", async () => {
    admin.auth.admin.createUser.mockResolvedValueOnce({
      data: { user: null },
      error: { code: "email_exists", message: "A user with this email address has already been registered" },
    });
    const out = await completeOnboarding(undefined, onboardingForm());
    expect(out).toEqual({
      error: "An account already exists for this email address. Sign in instead, or ask BluBook for help.",
    });
    expect(mocks.releaseInvitation).toHaveBeenCalledWith(admin.client, "inv-1");
  });

  it("creates a pending client holding the chosen package, closes the invitation and signs the client in", async () => {
    await expect(completeOnboarding(undefined, onboardingForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard");

    // The login is the invited address, not the one typed into the form.
    expect(admin.auth.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "invited@ridge.test", password: "a-good-password", email_confirm: true }),
    );
    expect(admin.argsOf("clients", "insert")[0][0]).toMatchObject({
      status: "pending",
      primary_profile_id: "user-new",
      trading_name: "Ridge Foods",
    });
    expect(admin.argsOf("onboardings", "insert")[0][0]).toMatchObject({
      client_id: "cli-1",
      sales_rep_id: "staff-inviter",
      status: "in_progress",
      requested_package: ASSEMBLY,
    });
    expect(mocks.acceptInvitation).toHaveBeenCalledWith(admin.client, "inv-1", "cli-1");
    expect(mocks.notifyApprovers).toHaveBeenCalledWith(admin.client, "Ridge Foods");
    expect(session.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "invited@ridge.test",
      password: "a-good-password",
    });
    // Nothing is activated or routed at submission.
    expect(admin.tablesTouched()).not.toContain("client_packages");
    expect(admin.tablesTouched()).not.toContain("service_requests");
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("undoes everything and hands the invitation back if a step fails", async () => {
    admin = makeSupabaseFake({ clients: [{ data: null, error: { message: "duplicate key" } }] });
    mocks.createAdminClient.mockReturnValue(admin.client);

    const out = await completeOnboarding(undefined, onboardingForm());

    expect(out).toEqual({
      error: "Your details could not be saved just now. Nothing was created — please try again in a moment.",
    });
    expect(mocks.rollbackOnboarding).toHaveBeenCalledWith(admin.client, { userId: "user-new", clientId: null, uploaded: [] });
    expect(mocks.releaseInvitation).toHaveBeenCalledWith(admin.client, "inv-1");
    expect(mocks.acceptInvitation).not.toHaveBeenCalled();
    expect(session.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("does not undo a complete submission when the approvers could not be notified", async () => {
    mocks.notifyApprovers.mockRejectedValue(new Error("notifications down"));
    await expect(completeOnboarding(undefined, onboardingForm())).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(mocks.rollbackOnboarding).not.toHaveBeenCalled();
  });
});

describe("approveOnboarding", () => {
  const APPROVER = { id: "approver-1", user_type: "staff", staff_role: "operations" };
  const approvalForm = () => {
    const fd = new FormData();
    fd.set("onboardingId", ONBOARDING_ID);
    return fd;
  };
  const approved = {
    client_id: "44444444-4444-4444-8444-444444444444",
    client_profile_id: "55555555-5555-4555-8555-555555555555",
    business_name: "Ridge Foods",
    service_ids: ["66666666-6666-4666-8666-666666666666"],
  };

  beforeEach(() => {
    mocks.getCurrentProfile.mockResolvedValue(APPROVER);
    mocks.requireStaffRole.mockResolvedValue(null);
    session.rpc.mockResolvedValue({ data: approved as unknown as unknown[], error: null });
    mocks.deliverDefaultDocuments.mockResolvedValue([{ storagePath: "cli/doc.pdf" }]);
    mocks.complianceChecklistFor.mockResolvedValue([{ id: "d1", name: "Tax clearance" }]);
  });

  it("refuses anyone but operations or sales admin", async () => {
    mocks.requireStaffRole.mockResolvedValue("This is restricted to operations or sales_admin staff.");
    expect(await approveOnboarding(undefined, approvalForm())).toEqual({
      error: "This is restricted to operations or sales_admin staff.",
    });
    expect(mocks.requireStaffRole).toHaveBeenCalledWith("operations", "sales_admin");
    expect(session.rpc).not.toHaveBeenCalled();
  });

  it("passes the database's refusal through, and delivers nothing", async () => {
    session.rpc.mockResolvedValue({ data: null, error: { message: "This client has already been approved" } });
    expect(await approveOnboarding(undefined, approvalForm())).toEqual({ error: "This client has already been approved" });
    expect(mocks.deliverDefaultDocuments).not.toHaveBeenCalled();
  });

  it("approves in the database, then delivers the pack and threads as the approver", async () => {
    expect(await approveOnboarding(undefined, approvalForm())).toEqual({ ok: true, businessName: "Ridge Foods" });

    expect(session.rpc).toHaveBeenCalledWith("approve_client_onboarding", { p_onboarding_id: ONBOARDING_ID });
    expect(mocks.deliverDefaultDocuments).toHaveBeenCalledWith(admin.client, {
      clientId: approved.client_id,
      clientProfileId: approved.client_profile_id,
      staffProfileId: "approver-1",
      serviceIds: approved.service_ids,
    });
    expect(mocks.runOnboardingCheck).toHaveBeenCalledWith(admin.client, expect.objectContaining({
      staffProfileId: "approver-1", deliveredCount: 1,
    }));
    expect(mocks.createComplianceRequest).toHaveBeenCalledWith(admin.client, expect.objectContaining({
      onboardingId: ONBOARDING_ID, items: [{ id: "d1", name: "Tax clearance" }],
    }));
  });

  it("reports a failed welcome pack without pretending the approval failed", async () => {
    mocks.runOnboardingCheck.mockRejectedValue(new Error("onboarding check service missing"));
    const out = await approveOnboarding(undefined, approvalForm());
    expect(out).toMatchObject({ ok: true, businessName: "Ridge Foods" });
    expect((out as { warning: string }).warning).toMatch(/client is live/);
  });
});
