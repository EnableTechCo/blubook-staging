import "server-only";

// EmailJS, called server-side.
//
// EmailJS is built for browser contact forms, where the public key is exposed
// and anyone can fire your templates. Onboarding is a staff server action, so
// the send happens here with the private key, which never reaches the client.
// That requires "Allow EmailJS API for non-browser applications" to be enabled
// in the EmailJS account settings; without it the API rejects the call.
//
// Every credential is optional. With none set the sender reports "skipped"
// rather than throwing, so onboarding works in environments that have no email
// configured — local development, CI, and any preview deploy.

const ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

interface EmailJsConfig {
  serviceId: string;
  publicKey: string;
  privateKey: string;
  credentialsTemplateId: string;
}

export function emailJsConfig(): EmailJsConfig | null {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const credentialsTemplateId = process.env.EMAILJS_TEMPLATE_CREDENTIALS;

  if (!serviceId || !publicKey || !privateKey || !credentialsTemplateId) return null;
  return { serviceId, publicKey, privateKey, credentialsTemplateId };
}

export type EmailResult =
  | { status: "sent" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

async function send(
  config: EmailJsConfig,
  templateId: string,
  templateParams: Record<string, string>,
): Promise<EmailResult> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
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
    // A network failure must not take onboarding down with it.
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

// The credentials email: temporary password and a link to sign in. Goes to the
// customer's own inbox, which is the only part of onboarding that leaves the
// platform — the welcome message stays in their BluBook inbox.
export async function sendCredentialsEmail(input: {
  toEmail: string;
  toName: string;
  businessName: string;
  tempPassword: string;
  loginUrl: string;
}): Promise<EmailResult> {
  const config = emailJsConfig();
  if (!config) return { status: "skipped", reason: "EmailJS is not configured" };

  return send(config, config.credentialsTemplateId, {
    to_email: input.toEmail,
    to_name: input.toName,
    business_name: input.businessName,
    temp_password: input.tempPassword,
    login_url: input.loginUrl,
    reply_to: input.toEmail,
  });
}
