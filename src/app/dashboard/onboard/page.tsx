import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { OnboardClientForm, type PackageOption } from "@/features/onboarding/OnboardClientForm";

export const metadata: Metadata = { title: "Onboard a client · BluBook" };
export const dynamic = "force-dynamic";

export default async function OnboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "staff") redirect("/dashboard");

  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("packages")
    .select("id,name,tier,price")
    .eq("active", true)
    .order("price");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl px-6 py-8">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:underline">
          ← Back to control desk
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Onboard a client</h1>
        <p className="mb-6 mt-1 text-sm text-slate-600">
          Create the client&apos;s account and package. This provisions their login, assembles the
          package, seeds the compliance checklist, and generates their initial service requests.
        </p>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <OnboardClientForm packages={(packages ?? []) as PackageOption[]} />
        </div>
      </div>
    </div>
  );
}
