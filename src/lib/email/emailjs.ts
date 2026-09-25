import "server-only";

// EmailJS, called server-side.
//
// EmailJS is built for browser contact forms, where the public key is exposed
// and anyone can fire your templates. Every send here happens in a server
// action with the private key, which never reaches the client. That requires
// "Allow EmailJS API for non-browser applications" to be enabled in the EmailJS
// account settings; without it the API rejects the call.
//
// Every credential is optional. With none set the sender reports "skipped"
// rather than throwing, so local development, CI and preview deploys work
// without email configured — the invitation screen then shows the link for
// staff to pass on themselves.

const ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

// Outside production, EMAILJS_TEST_ENDPOINT points sends at the local mail sink
// (tests/e2e/support/mail-sink.mjs) so an end-to-end run can read the message.
// Production always uses the real endpoint, whatever the environment says.
function endpoint(): string {
  if (process.env.NODE_ENV === "production") return ENDPOINT;
  return process.env.EMAILJS_TEST_ENDPOINT || ENDPOINT;
}

interface EmailJsConfig {
  serviceId: string;
  publicKey: string;
  privateKey: string;
}

export function emailJsConfig(): EmailJsConfig | null {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !publicKey || !privateKey) return null;
  return { serviceId, publicKey, privateKey };
}

export type EmailResult =
  | { status: "sent" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

async function send(
  templateId: string | undefined,
  templateParams: Record<string, string>,
  missingTemplate: string,
): Promise<EmailResult> {
  const config = emailJsConfig();
  if (!config) return { status: "skipped", reason: "EmailJS is not configured" };
  if (!templateId) return { status: "skipped", reason: missingTemplate };

  let response: Response;
  try {
    response = await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: config.serviceId,
        template_id: templateId,
        user_id: config.publicKey,
        accessToken: config.privateKey,
        template_params: templateParams,
      }),
    });
  } catch (error) {
    // A network failure must not take the calling action down with it.
    return { status: "failed", reason: error instanceof Error ? error.message : "Network error" };
  }

  if (!response.ok) {
    // EmailJS returns a plain-text reason, which is what makes failures
    // diagnosable — an unconfigured template or a disabled API shows up here.
    const reason = (await response.text().catch(() => "")) || `HTTP ${response.status}`;
    return { status: "failed", reason: reason.slice(0, 300) };
  }

  return { status: "sent" };
}

// The onboarding invitation: a single-use link to complete onboarding and set
// a password. The parameter names are the ones the EMAILJS_TEMPLATE_ONBOARDING_INVITE
// template was built with, so an existing template keeps working. Reply-To is
// set on the template, never passed here, so replies come to BluBook.
export function sendInvitationEmail(input: {
  toEmail: string;
  inviteUrl: string;
  expiresIn: string;
}): Promise<EmailResult> {
  return send(
    process.env.EMAILJS_TEMPLATE_ONBOARDING_INVITE,
    { to_email: input.toEmail, invite_url: input.inviteUrl, expires_in: input.expiresIn },
    "No invitation email template configured",
  );
}

// The weekly compliance copy to a client's Compliance Manager. Its own
// template, because it says something entirely different from the invitation;
// without one configured the copy is skipped rather than sent through a
// template that would render the wrong words.
export function sendComplianceEmail(input: {
  toEmail: string;
  toName: string;
  businessName: string;
  ratio: string;
  period: string;
  shortfall: string;
}): Promise<EmailResult> {
  return send(
    process.env.EMAILJS_TEMPLATE_COMPLIANCE,
    {
      to_email: input.toEmail,
      to_name: input.toName,
      business_name: input.businessName,
      compliance_ratio: input.ratio,
      period: input.period,
      shortfall: input.shortfall,
    },
    "No compliance email template configured",
  );
}
