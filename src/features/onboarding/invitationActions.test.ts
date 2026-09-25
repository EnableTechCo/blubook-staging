import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseFake } from "../../../tests/stubs/supabaseFake";

const mocks = vi.hoisted(() => ({
  requireStaffRole: vi.fn(),
  getCurrentProfile: vi.fn(),
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  sendInvitationEmail: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/services/staffRole", () => ({ requireStaffRole: mocks.requireStaffRole }));
vi.mock("@/services/profiles", () => ({ getCurrentProfile: mocks.getCurrentProfile }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/email/emailjs", () => ({ sendInvitationEmail: mocks.sendInvitationEmail }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { inviteClient, resendInvitation, revokeInvitation } from "@/features/onboarding/invitationActions";

const STAFF = { id: "staff-1", user_type: "staff", staff_role: "operations" };
const INVITATION_ID = "11111111-1111-4111-8111-111111111111";

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

function wire(session: ReturnType<typeof makeSupabaseFake>, admin = makeSupabaseFake({ profiles: [{ data: null }] })) {
  mocks.createClient.mockResolvedValue(session.client);
  mocks.createAdminClient.mockReturnValue(admin.client);
  return { session, admin };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireStaffRole.mockResolvedValue(null);
  mocks.getCurrentProfile.mockResolvedValue(STAFF);
  process.env.NEXT_PUBLIC_APP_URL = "https://blubook.test";
});

describe("inviteClient", () => {
  it("refuses anyone the role check refuses, before touching anything", async () => {
    mocks.requireStaffRole.mockResolvedValue("This is restricted to operations or sales_admin staff.");
    expect(await inviteClient(undefined, form({ email: "a@b.test" }))).toEqual({
      error: "This is restricted to operations or sales_admin staff.",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.requireStaffRole).toHaveBeenCalledWith("operations", "sales_admin");
  });

  it("refuses an address that is not one", async () => {
    const out = await inviteClient(undefined, form({ email: "not-an-email" }));
    expect(out).toEqual({ error: "Enter the client's email address" });
  });

  it("refuses an address that already has a BluBook account", async () => {
    const { session } = wire(makeSupabaseFake(), makeSupabaseFake({ profiles: [{ data: { id: "someone" } }] }));
    expect(await inviteClient(undefined, form({ email: "taken@example.test" }))).toEqual({
      error: "A BluBook account already exists for this email address.",
    });
    expect(session.from).not.toHaveBeenCalled();
  });

  it("retires older links, stores only a digest, emails the link and records that it was sent", async () => {
    const { session, admin } = wire(
      makeSupabaseFake({ client_invitations: [{ data: null }, { data: { id: "inv-new" } }, { data: null }] }),
    );
    mocks.sendInvitationEmail.mockResolvedValue({ status: "sent" });

    const out = await inviteClient(undefined, form({ email: "  New@Client.TEST ", businessName: "Ridge Foods" }));

    expect(out).toEqual({ ok: true, email: "new@client.test", delivery: "sent" });
    expect(admin.argsOf("profiles", "eq")).toEqual([["email", "new@client.test"]]);

    const updates = session.argsOf("client_invitations", "update");
    const [insert] = session.argsOf("client_invitations", "insert");
    expect(updates[0][0]).toHaveProperty("revoked_at");
    expect(insert[0]).toMatchObject({ email: "new@client.test", business_name: "Ridge Foods", invited_by: "staff-1" });
    expect((insert[0] as { token_hash: string }).token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(updates[1][0]).toHaveProperty("sent_at");

    const { inviteUrl, toEmail } = mocks.sendInvitationEmail.mock.calls[0][0];
    expect(toEmail).toBe("new@client.test");
    expect(inviteUrl).toMatch(/^https:\/\/blubook\.test\/invite\/[A-Za-z0-9_-]{43}$/);
    // The raw token is in the link and nowhere in what was stored.
    expect(JSON.stringify(insert)).not.toContain(inviteUrl.split("/").pop());
  });

  it("hands the link back once when the email did not go", async () => {
    wire(makeSupabaseFake({ client_invitations: [{ data: null }, { data: { id: "inv-new" } }] }));
    mocks.sendInvitationEmail.mockResolvedValue({ status: "skipped", reason: "EmailJS is not configured" });

    const out = await inviteClient(undefined, form({ email: "new@client.test" }));

    expect(out).toMatchObject({ ok: true, delivery: "not_sent", reason: "EmailJS is not configured" });
    expect((out as { link: string }).link).toMatch(/\/invite\/[A-Za-z0-9_-]{43}$/);
  });
});

describe("resendInvitation", () => {
  it("will not reissue an invitation that has already been used", async () => {
    wire(makeSupabaseFake({ client_invitations: [{ data: { email: "a@b.test", business_name: null, accepted_at: "2026-09-20" } }] }));
    expect(await resendInvitation(undefined, form({ invitationId: INVITATION_ID }))).toEqual({
      error: "This invitation has already been used.",
    });
    expect(mocks.sendInvitationEmail).not.toHaveBeenCalled();
  });

  it("issues a fresh link to the same address", async () => {
    wire(
      makeSupabaseFake({
        client_invitations: [
          { data: { email: "a@b.test", business_name: "Ridge", accepted_at: null } },
          { data: null },
          { data: { id: "inv-2" } },
          { data: null },
        ],
      }),
    );
    mocks.sendInvitationEmail.mockResolvedValue({ status: "sent" });
    expect(await resendInvitation(undefined, form({ invitationId: INVITATION_ID }))).toEqual({
      ok: true, email: "a@b.test", delivery: "sent",
    });
  });
});

describe("revokeInvitation", () => {
  it("withdraws only an invitation that is still open", async () => {
    const { session } = wire(makeSupabaseFake({ client_invitations: [{ data: null }] }));
    await revokeInvitation(form({ invitationId: INVITATION_ID }));
    expect(session.argsOf("client_invitations", "eq")).toEqual([["id", INVITATION_ID]]);
    expect(session.argsOf("client_invitations", "is")).toEqual([["accepted_at", null], ["revoked_at", null]]);
  });

  it("does nothing for someone the role check refuses", async () => {
    mocks.requireStaffRole.mockResolvedValue("Only staff can do this.");
    await revokeInvitation(form({ invitationId: INVITATION_ID }));
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
