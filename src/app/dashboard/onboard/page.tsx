import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { OnboardClientForm } from "@/features/onboarding/OnboardClientForm";
import type { BuilderLineItem, BuilderPackage } from "@/features/onboarding/PackageBuilder";

export const metadata: Metadata = { title: "Onboard a client · BluBook" };
export const dynamic = "force-dynamic";

export default async function OnboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "staff") redirect("/dashboard");

  const supabase = await createClient();
  const [pkgRes, itemRes] = await Promise.all([
    supabase
      .from("packages")
      .select("id,name,tier,price,package_line_items(line_items(id,name,tier,price))")
      .eq("active", true)
      .order("price")
      .returns<
        { id: string; name: string; tier: string; price: number; package_line_items: { line_items: { id: string; name: string; tier: string; price: number } | null }[] }[]
      >(),
    supabase
      .from("line_items")
      .select("id,name,tier,price,services(name)")
      .eq("active", true)
      .order("name")
      .returns<{ id: string; name: string; tier: string; price: number; services: { name: string } | null }[]>(),
  ]);

  const packages: BuilderPackage[] = (pkgRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    price: p.price,
    items: p.package_line_items.map((pli) => pli.line_items).filter((li): li is NonNullable<typeof li> => Boolean(li)),
  }));

  const lineItems: BuilderLineItem[] = (itemRes.data ?? []).map((li) => ({
    id: li.id,
    name: li.name,
    tier: li.tier,
    price: li.price,
    serviceName: li.services?.name ?? "—",
  }));

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
          <OnboardClientForm packages={packages} lineItems={lineItems} />
        </div>
      </div>
    </div>
  );
}
