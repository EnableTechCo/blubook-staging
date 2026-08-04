import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEYS = [
  "EMAILJS_SERVICE_ID",
  "EMAILJS_PUBLIC_KEY",
  "EMAILJS_PRIVATE_KEY",
  "EMAILJS_TEMPLATE_CREDENTIALS",
] as const;

const configure = () => KEYS.forEach((key) => (process.env[key] = `test-${key}`));
const clear = () => KEYS.forEach((key) => delete process.env[key]);

async function sendCredentials() {
  const { sendCredentialsEmail } = await import("@/lib/email/emailjs");
  return sendCredentialsEmail({
    toEmail: "client@example.com",
    toName: "Ivy Intake",
    businessName: "Intake Co",
    tempPassword: "Temp123!",
    loginUrl: "https://example.com/login/client",
  });
}

beforeEach(() => {
  vi.resetModules();
  clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  clear();
});

// Onboarding creates a live account before this runs, so no outcome here may
// throw — a mail problem must never undo an account that already exists.
describe("sendCredentialsEmail", () => {
  it("skips cleanly when EmailJS is not configured", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await sendCredentials()).toEqual({
      status: "skipped",
      reason: "EmailJS is not configured",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips when only some credentials are present", async () => {
    process.env.EMAILJS_SERVICE_ID = "service";
    const result = await sendCredentials();
    expect(result.status).toBe("skipped");
  });

  it("reports sent on success", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => "OK" }));
    expect(await sendCredentials()).toEqual({ status: "sent" });
  });

  it("sends the private key as accessToken, never the public one alone", async () => {
    configure();
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, text: async () => "OK" });
    vi.stubGlobal("fetch", fetchSpy);
    await sendCredentials();

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.accessToken).toBe("test-EMAILJS_PRIVATE_KEY");
    expect(body.user_id).toBe("test-EMAILJS_PUBLIC_KEY");
    expect(body.template_params.temp_password).toBe("Temp123!");
    expect(body.template_params.to_email).toBe("client@example.com");
    expect(body.template_params.login_url).toBe("https://example.com/login/client");
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
    const result = await sendCredentials();
    expect(result).toEqual({
      status: "failed",
      reason: "API access from non-browser environments is currently disabled.",
    });
  });

  it("survives a network failure", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("getaddrinfo ENOTFOUND")));
    expect(await sendCredentials()).toEqual({
      status: "failed",
      reason: "getaddrinfo ENOTFOUND",
    });
  });
});
