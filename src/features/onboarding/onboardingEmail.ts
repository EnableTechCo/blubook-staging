import "server-only";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

export type OnboardingEmailResult =
  | { status: "sent" }
  | { status: "failed"; reason: string };

async function sendTemplate(
  templateId: string | undefined,
  templateParams: Record<string, string>,
): Promise<OnboardingEmailResult> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  if (!serviceId || !publicKey || !privateKey || !templateId) {
    return { status: "failed", reason: "Onboarding email is not configured" };
  }

  const endpoint = process.env.NODE_ENV === "production"
    ? EMAILJS_ENDPOINT
    : process.env.EMAILJS_TEST_ENDPOINT ?? EMAILJS_ENDPOINT;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: templateParams,
      }),
    });
    if (!response.ok) return { status: "failed", reason: "Onboarding email delivery failed" };
    return { status: "sent" };
  } catch {
    return { status: "failed", reason: "Onboarding email delivery failed" };
  }
}

export function sendOnboardingInvitationEmail(toEmail: string, inviteUrl: string) {
  return sendTemplate(process.env.EMAILJS_TEMPLATE_ONBOARDING_INVITE, {
    to_email: toEmail,
    invite_url: inviteUrl,
    expires_in: "7 days",
  });
}

export function sendCredentialSetupEmail(toEmail: string, toName: string, setupUrl: string) {
  return sendTemplate(process.env.EMAILJS_TEMPLATE_CREDENTIAL_SETUP, {
    to_email: toEmail,
    to_name: toName,
    setup_url: setupUrl,
  });
}
