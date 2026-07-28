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
        {
          id: string;
          name: string;
          tier: string;
          price: number;
          package_line_items: {
            line_items: { id: string; name: string; tier: string; price: number } | null;
          }[];
        }[]
      >(),
    supabase
      .from("line_items")
      .select("id,name,tier,price,services(name)")
      .eq("active", true)
      .order("name")
      .returns<
        {
          id: string;
          name: string;
          tier: string;
          price: number;
          services: { name: string } | null;
        }[]
      >(),
  ]);

  const packages: BuilderPackage[] = (pkgRes.data ?? []).map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    tier: pkg.tier,
    price: pkg.price,
    items: pkg.package_line_items
      .map((packageLineItem) => packageLineItem.line_items)
      .filter((lineItem): lineItem is NonNullable<typeof lineItem> => Boolean(lineItem)),
  }));

  const lineItems: BuilderLineItem[] = (itemRes.data ?? []).map((lineItem) => ({
    id: lineItem.id,
    name: lineItem.name,
    tier: lineItem.tier,
    price: lineItem.price,
    serviceName: lineItem.services?.name ?? "—",
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-ink pb-7">
        <Link
          href="/dashboard"
          className="inline-flex min-h-10 items-center font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/60 hover:text-cobalt"
        >
          ← Back to control desk
        </Link>
        <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cobalt">
          Operations / Client intake
        </p>
        <h1 className="mt-3 font-heading text-4xl leading-none sm:text-5xl">Onboard a client</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/65">
          Provision the client login, assemble their service package, seed the compliance checklist
          and generate the initial requests in one controlled workflow.
        </p>
      </header>

      <OnboardClientForm packages={packages} lineItems={lineItems} />
    </div>
  );
}
