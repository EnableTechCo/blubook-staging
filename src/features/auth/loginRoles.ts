export const LOGIN_ROLES = ["client", "provider", "staff"] as const;

export type LoginRole = (typeof LOGIN_ROLES)[number];

export type LoginExperienceCopy = {
  eyebrow: string;
  title: string;
  emphasis: string;
  introduction: string;
  panelTitle: string;
  panelCopy: string;
  submitLabel: string;
};

export const neutralLoginCopy: LoginExperienceCopy = {
  eyebrow: "Secure workspace access",
  title: "Welcome",
  emphasis: "back.",
  introduction:
    "Sign in with the account BluBook has assigned to you. Your profile opens the correct workspace.",
  panelTitle: "One sign-in. The right workspace.",
  panelCopy:
    "Client, Provider, and Staff access all use the same secure sign-in. Your account—not this page—determines what you can see and do.",
  submitLabel: "Sign in",
};

export const loginRoleCopy: Record<LoginRole, LoginExperienceCopy> = {
  client: {
    eyebrow: "Client access",
    title: "Return to the work",
    emphasis: "already in motion.",
    introduction:
      "Review your managed account, onboarding progress, and service requests in one place.",
    panelTitle: "Your business, clearly coordinated.",
    panelCopy:
      "BluBook keeps your active service arrangement and request progress visible while Staff coordinates the work behind it.",
    submitLabel: "Sign in as a Client",
  },
  provider: {
    eyebrow: "Provider access",
    title: "See the work assigned",
    emphasis: "to your practice.",
    introduction:
      "Review routed offers, assigned requests, and the capabilities registered to your Provider account.",
    panelTitle: "A focused view of assigned work.",
    panelCopy:
      "Respond to routed opportunities and keep supported request progress current from your authorized workspace.",
    submitLabel: "Sign in as a Provider",
  },
  staff: {
    eyebrow: "Staff access",
    title: "Keep the service network",
    emphasis: "moving.",
    introduction:
      "Coordinate Client onboarding, supported requests, and the Provider registry from one operational workspace.",
    panelTitle: "Operations in one accountable view.",
    panelCopy:
      "BluBook Staff can manage the supported workflows already assigned to their account and role.",
    submitLabel: "Sign in as Staff",
  },
};

export function isLoginRole(value: string): value is LoginRole {
  return LOGIN_ROLES.some((role) => role === value);
}
