import { describe, expect, it } from "vitest";
import { makeSupabaseFake } from "../../../tests/stubs/supabaseFake";
import type { Admin } from "@/features/onboarding/onboardClientSteps";
import {
  acceptInvitation,
  claimInvitation,
  findInvitation,
  hashInvitationToken,
  invitationStatus,
  invitationUrl,
  isWellFormedToken,
  newInvitationToken,
  releaseInvitation,
} from "@/features/onboarding/invitations";

const admin = (fake: ReturnType<typeof makeSupabaseFake>) => fake.client as unknown as Admin;
const FUTURE = "2999-01-01T00:00:00Z";
const PAST = "2000-01-01T00:00:00Z";

describe("tokens", () => {
  it("issues a 43-character base64url token and stores only its SHA-256 digest", () => {
    const { token, tokenHash } = newInvitationToken();
    expect(isWellFormedToken(token)).toBe(true);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).toBe(hashInvitationToken(token));
    expect(tokenHash).not.toContain(token);
  });

  it("never issues the same token twice", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => newInvitationToken().token));
    expect(tokens.size).toBe(50);
  });

  it.each(["", "short", "a".repeat(42), "a".repeat(44), `${"a".repeat(42)}/`, `${"a".repeat(42)}=`])(
    "refuses %j as a token",
    (token) => {
      expect(isWellFormedToken(token)).toBe(false);
    },
  );

  it("builds the link from the app URL without doubling a slash", () => {
    expect(invitationUrl("tok", "https://blubook.test/")).toBe("https://blubook.test/invite/tok");
    expect(invitationUrl("tok", "https://blubook.test")).toBe("https://blubook.test/invite/tok");
  });
});

describe("invitationStatus", () => {
  const base = { expires_at: FUTURE, revoked_at: null, claimed_at: null, accepted_at: null };

  it("is open while unused and in date", () => {
    expect(invitationStatus(base)).toBe("open");
  });

  it("treats accepted and revoked as final, whatever the clock says", () => {
    expect(invitationStatus({ ...base, expires_at: PAST, accepted_at: PAST })).toBe("accepted");
    expect(invitationStatus({ ...base, expires_at: PAST, revoked_at: PAST })).toBe("revoked");
  });

  it("expires an unused invitation, and marks one being submitted as in use", () => {
    expect(invitationStatus({ ...base, expires_at: PAST })).toBe("expired");
    expect(invitationStatus({ ...base, claimed_at: PAST })).toBe("in_use");
  });
});

describe("findInvitation", () => {
  it("refuses a malformed token without asking the database", async () => {
    const fake = makeSupabaseFake();
    expect(await findInvitation(admin(fake), "not-a-token")).toEqual({ problem: "invalid" });
    expect(fake.from).not.toHaveBeenCalled();
  });

  it("looks the invitation up by digest, never by the token itself", async () => {
    const { token, tokenHash } = newInvitationToken();
    const fake = makeSupabaseFake({
      client_invitations: [{
        data: {
          id: "inv-1", email: "client@example.test", business_name: "Ridge", invited_by: "staff-1",
          expires_at: FUTURE, revoked_at: null, claimed_at: null, accepted_at: null,
        },
      }],
    });

    expect(await findInvitation(admin(fake), token)).toEqual({
      invitation: { id: "inv-1", email: "client@example.test", business_name: "Ridge", invited_by: "staff-1" },
    });
    expect(fake.argsOf("client_invitations", "eq")).toEqual([["token_hash", tokenHash]]);
  });

  it("reports an unknown token as invalid and a used one as accepted", async () => {
    const { token } = newInvitationToken();
    const unknown = makeSupabaseFake({ client_invitations: [{ data: null }] });
    expect(await findInvitation(admin(unknown), token)).toEqual({ problem: "invalid" });

    const used = makeSupabaseFake({
      client_invitations: [{ data: { id: "i", email: "e", business_name: null, invited_by: null, expires_at: FUTURE, revoked_at: null, claimed_at: null, accepted_at: PAST } }],
    });
    expect(await findInvitation(admin(used), token)).toEqual({ problem: "accepted" });
  });
});

describe("claim, release and accept", () => {
  it("claims only an invitation that is still open, and reports whether it won", async () => {
    const won = makeSupabaseFake({ client_invitations: [{ data: [{ id: "inv-1" }] }] });
    expect(await claimInvitation(admin(won), "inv-1")).toBe(true);
    expect(won.argsOf("client_invitations", "is")).toEqual([
      ["claimed_at", null],
      ["accepted_at", null],
      ["revoked_at", null],
    ]);
    expect(won.argsOf("client_invitations", "gt")[0][0]).toBe("expires_at");

    const lost = makeSupabaseFake({ client_invitations: [{ data: [] }] });
    expect(await claimInvitation(admin(lost), "inv-1")).toBe(false);
  });

  it("hands an unaccepted invitation back", async () => {
    const fake = makeSupabaseFake({ client_invitations: [{ data: null }] });
    await releaseInvitation(admin(fake), "inv-1");
    expect(fake.argsOf("client_invitations", "update")).toEqual([[{ claimed_at: null }]]);
    expect(fake.argsOf("client_invitations", "is")).toEqual([["accepted_at", null]]);
  });

  it("closes the invitation against the client, and surfaces a failure", async () => {
    const ok = makeSupabaseFake({ client_invitations: [{ data: null }] });
    await acceptInvitation(admin(ok), "inv-1", "cli-1");
    expect(ok.argsOf("client_invitations", "update")[0][0]).toMatchObject({ client_id: "cli-1" });

    const failed = makeSupabaseFake({ client_invitations: [{ data: null, error: { message: "denied" } }] });
    await expect(acceptInvitation(admin(failed), "inv-1", "cli-1")).rejects.toThrow("denied");
  });
});
