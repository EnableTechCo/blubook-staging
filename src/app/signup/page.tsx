import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/SignUpForm";

export const metadata: Metadata = { title: "Create account · BluBook" };

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">Sign up to get started with BluBook.</p>
      <SignUpForm />
    </main>
  );
}
