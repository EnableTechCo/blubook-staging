import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/AuthShell";
import { SignUpForm } from "@/features/auth/SignUpForm";

export const metadata: Metadata = { title: "Create Client account · BluBook" };

export default function SignUpPage() {
  return (
    <AuthShell
      panelTitle="Account access starts with BluBook."
      panelCopy="Client accounts are normally prepared as part of Staff-led onboarding so the correct business and service arrangement can be linked."
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
        Client account setup
      </p>
      <h1 className="mt-5 max-w-[12ch] font-heading text-[clamp(3.4rem,8vw,5.4rem)] font-medium leading-[0.82] tracking-[-0.06em]">
        Create your <em className="font-normal text-cobalt">Client account.</em>
      </h1>
      <p className="mt-6 max-w-lg border-l-4 border-sun bg-sun/15 px-4 py-3 font-body text-sm leading-6 text-ink">
        Use this form only if a BluBook representative has instructed you to create
        an account. Provider and Staff accounts are provisioned internally.
      </p>
      <SignUpForm />
    </AuthShell>
  );
}
