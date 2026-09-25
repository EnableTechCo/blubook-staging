import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEYS = [
  "EMAILJS_SERVICE_ID",
  "EMAILJS_PUBLIC_KEY",
  "EMAILJS_PRIVATE_KEY",
  "EMAILJS_TEMPLATE_ONBOARDING_INVITE",
  "EMAILJS_TEMPLATE_COMPLIANCE",
  "EMAILJS_TEST_ENDPOINT",
] as const;

const configure = () =>
  KEYS.filter((key) => key !== "EMAILJS_TEST_ENDPOINT").forEach((key) => (process.env[key] = `test-${key}`));
const clear = () => KEYS.forEach((key) => delete process.env[key]);

async function sendInvitation() {
  const { sendInvitationEmail } = await import("@/lib/email/emailjs");
  return sendInvitationEmail({
    toEmail: "client@example.com",
    inviteUrl: "https://example.com/invite/abc",
    expiresIn: "7 days",
  });
}

beforeEach(() => {
  vi.resetModules();
  clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  clear();
});

// The invitation already exists when this runs, so no outcome may throw: a mail
// problem means staff pass the link on themselves, not that the invite fails.
describe("sendInvitationEmail", () => {
  it("skips cleanly when EmailJS is not configured", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await sendInvitation()).toEqual({ status: "skipped", reason: "EmailJS is not configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips when only some credentials are present", async () => {
    process.env.EMAILJS_SERVICE_ID = "service";
    expect((await sendInvitation()).status).toBe("skipped");
  });

  it("skips when the invitation template is not configured", async () => {
    configure();
    delete process.env.EMAILJS_TEMPLATE_ONBOARDING_INVITE;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await sendInvitation()).toEqual({ status: "skipped", reason: "No invitation email template configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends the private key as accessToken and the template's own parameter names", async () => {
    configure();
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, text: async () => "OK" });
    vi.stubGlobal("fetch", fetchSpy);
    expect(await sendInvitation()).toEqual({ status: "sent" });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.accessToken).toBe("test-EMAILJS_PRIVATE_KEY");
    expect(body.user_id).toBe("test-EMAILJS_PUBLIC_KEY");
    expect(body.template_id).toBe("test-EMAILJS_TEMPLATE_ONBOARDING_INVITE");
    expect(body.template_params).toEqual({
      to_email: "client@example.com",
      invite_url: "https://example.com/invite/abc",
      expires_in: "7 days",
    });
  });

  it("sends to the local mail sink outside production", async () => {
    configure();
    process.env.EMAILJS_TEST_ENDPOINT = "http://127.0.0.1:4321/api/v1.0/email/send";
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, text: async () => "OK" });
    vi.stubGlobal("fetch", fetchSpy);
    await sendInvitation();
    expect(fetchSpy.mock.calls[0][0]).toBe("http://127.0.0.1:4321/api/v1.0/email/send");
  });

  it("ignores the test endpoint in production", async () => {
    configure();
    process.env.EMAILJS_TEST_ENDPOINT = "http://127.0.0.1:4321/api/v1.0/email/send";
    vi.stubEnv("NODE_ENV", "production");
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, text: async () => "OK" });
    vi.stubGlobal("fetch", fetchSpy);
    await sendInvitation();
    expect(fetchSpy.mock.calls[0][0]).toBe("https://api.emailjs.com/api/v1.0/email/send");
  });

  // The real 403 says non-browser API access is disabled; surfacing that text
  // is what makes the problem fixable rather than a silent non-delivery.
  it("returns the provider's reason on rejection instead of throwing", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => "API access from non-browser environments is currently disabled.",
      }),
    );
    expect(await sendInvitation()).toEqual({
      status: "failed",
      reason: "API access from non-browser environments is currently disabled.",
    });
  });

  it("survives a network failure", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("getaddrinfo ENOTFOUND")));
    expect(await sendInvitation()).toEqual({ status: "failed", reason: "getaddrinfo ENOTFOUND" });
  });
});

describe("sendComplianceEmail", () => {
  const sendCompliance = async () => {
    const { sendComplianceEmail } = await import("@/lib/email/emailjs");
    return sendComplianceEmail({
      toEmail: "coach@example.com",
      toName: "Thabo",
      businessName: "Ridge",
      ratio: "72%",
      period: "Q2 week 3, FY2026",
      shortfall: "Tax clearance",
    });
  };

  it("skips when the compliance template is not configured", async () => {
    configure();
    delete process.env.EMAILJS_TEMPLATE_COMPLIANCE;
    expect(await sendCompliance()).toEqual({ status: "skipped", reason: "No compliance email template configured" });
  });

  it("sends through the compliance template", async () => {
    configure();
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, text: async () => "OK" });
    vi.stubGlobal("fetch", fetchSpy);
    expect(await sendCompliance()).toEqual({ status: "sent" });
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.template_id).toBe("test-EMAILJS_TEMPLATE_COMPLIANCE");
    expect(body.template_params.compliance_ratio).toBe("72%");
  });
});
