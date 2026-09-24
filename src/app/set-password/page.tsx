import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";
import { SetPasswordForm } from "@/features/onboarding/SetPasswordForm";

export const metadata: Metadata = { title: "Set your password · BluBook" };

export default async function SetPasswordPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?credentialLink=invalid");
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-5 py-16">
      <section className="workspace-panel w-full p-6 sm:p-8">
        <p className="workspace-eyebrow">Secure account setup</p>
        <h1 className="mt-3 font-heading text-3xl">Choose your password</h1>
        <p className="mt-3 text-sm text-ink/65">Your secure setup link is single-use. Choose a password to access your BluBook workspace.</p>
        <SetPasswordForm />
      </section>
    </main>
  );
}
