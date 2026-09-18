import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEYS = [
  "EMAILJS_SERVICE_ID",
  "EMAILJS_PUBLIC_KEY",
  "EMAILJS_PRIVATE_KEY",
  "EMAILJS_TEMPLATE_COMPLIANCE",
] as const;

const configure = () => KEYS.forEach((key) => (process.env[key] = `test-${key}`));
const clear = () => KEYS.forEach((key) => delete process.env[key]);

async function sendCompliance() {
  const { sendComplianceEmail } = await import("@/lib/email/emailjs");
  return sendComplianceEmail({
    toEmail: "coach@example.com",
    toName: "Ivy Coach",
    businessName: "Example Co",
    ratio: "92%",
    period: "September 2026",
    shortfall: "Tax clearance certificate",
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

describe("sendComplianceEmail", () => {
  it("skips cleanly when EmailJS is not configured", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await sendCompliance()).toEqual({
      status: "skipped",
      reason: "EmailJS is not configured",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips when the compliance template is not configured", async () => {
    configure();
    delete process.env.EMAILJS_TEMPLATE_COMPLIANCE;
    expect(await sendCompliance()).toEqual({
      status: "skipped",
      reason: "No compliance email template configured",
    });
  });

  it("sends compliance data with both EmailJS keys", async () => {
    configure();
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, text: async () => "OK" });
    vi.stubGlobal("fetch", fetchSpy);

    expect(await sendCompliance()).toEqual({ status: "sent" });
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.accessToken).toBe("test-EMAILJS_PRIVATE_KEY");
    expect(body.user_id).toBe("test-EMAILJS_PUBLIC_KEY");
    expect(body.template_params.to_email).toBe("coach@example.com");
    expect(body.template_params.compliance_ratio).toBe("92%");
  });

  it("reports provider and network failures without throwing", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "API disabled" }),
    );
    expect(await sendCompliance()).toEqual({ status: "failed", reason: "API disabled" });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    expect(await sendCompliance()).toEqual({ status: "failed", reason: "network unavailable" });
  });
});
