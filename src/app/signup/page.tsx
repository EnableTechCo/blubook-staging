import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/AuthShell";
import { SignUpForm } from "@/features/auth/SignUpForm";

export const metadata: Metadata = { title: "Create Client account · BluBook" };

export default function SignUpPage() {
  return (
    <AuthShell
      panelTitle="Account access starts with BluBook."
      panelCopy="Client accounts are normally prepared as part of Staff-led onboarding so the correct business and service package can be linked."
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
        Client account setup
      </p>
      <h1 className="mt-4 max-w-[13ch] font-heading text-[clamp(2.5rem,5vw,3.75rem)] font-normal leading-[0.94] tracking-[-0.045em]">
        Create your <em className="font-normal text-cobalt">Client account.</em>
      </h1>
      <p className="mt-5 max-w-lg rounded-xl border border-cobalt/10 bg-cobalt-wash/55 px-4 py-3 font-body text-sm leading-6 text-ink">
        Use this form only if a BluBook representative has instructed you to create
        an account. Provider and Staff accounts are provisioned internally.
      </p>
      <SignUpForm />
    </AuthShell>
  );
}
