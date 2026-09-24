import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { requireStaffRoute } from "@/services/staffRole";
import { OnboardClientWizard, type WizardWorkGroup } from "@/features/onboarding/OnboardClientWizard";
import type { BuilderLineItem, BuilderPackage } from "@/features/onboarding/PackageBuilder";
import { WorkspaceHeader } from "@/components/ui/Workspace";

export const metadata: Metadata = { title: "Onboard a client · BluBook" };
export const dynamic = "force-dynamic";

type LineItemRow = {
  id: string;
  name: string;
  tier: string;
  price: number;
  services: { name: string; service_groups: { slug: string; name: string } | null } | null;
};

export default async function OnboardPage() {
  redirect("/dashboard/customers");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (await requireStaffRoute("/dashboard/customers")) redirect("/dashboard");

  const supabase = await createClient();
  const [pkgRes, itemRes, groupRes] = await Promise.all([
    supabase
      .from("packages")
      .select("id,name,tier,price,package_line_items(line_items(id,name,tier,price,services(name,service_groups(slug,name))))")
      .eq("active", true)
      .order("price")
      .returns<
        {
          id: string;
          name: string;
          tier: string;
          price: number;
          package_line_items: { line_items: LineItemRow | null }[];
        }[]
      >(),
    supabase
      .from("line_items")
      .select("id,name,tier,price,services(name,service_groups(slug,name))")
      .eq("active", true)
      .order("name")
      .returns<LineItemRow[]>(),
    // The partner-facing groups, in the order the catalogue lists them. Sales
    // Operations is BluBook's own desk and has no intake of its own.
    supabase
      .from("service_groups")
      .select("slug,name")
      .eq("active", true)
      .eq("internal", false)
      .order("name")
      .returns<WizardWorkGroup[]>(),
  ]);

  const packages: BuilderPackage[] = (pkgRes.data ?? []).map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    tier: pkg.tier,
    price: pkg.price,
    items: pkg.package_line_items
      .map((packageLineItem) => packageLineItem.line_items)
      .filter((lineItem): lineItem is LineItemRow => Boolean(lineItem))
      .map((lineItem) => ({
        id: lineItem.id,
        name: lineItem.name,
        tier: lineItem.tier,
        price: lineItem.price,
        workGroupSlug: lineItem.services?.service_groups?.slug ?? null,
      })),
  }));

  const lineItems: BuilderLineItem[] = (itemRes.data ?? []).map((lineItem) => ({
    id: lineItem.id,
    name: lineItem.name,
    tier: lineItem.tier,
    price: lineItem.price,
    serviceName: lineItem.services?.name ?? "—",
    workGroupName: lineItem.services?.service_groups?.name ?? null,
    workGroupSlug: lineItem.services?.service_groups?.slug ?? null,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard"
        className="inline-flex min-h-10 items-center font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/55 hover:text-cobalt"
      >
        ← Back to control desk
      </Link>
      <div className="mt-3">
        <WorkspaceHeader
          eyebrow="Operations / Client intake"
          title="Onboard a client"
          description="The client's details first, then a short stage for each work group their package draws on, so every team starts with what it needs. One submission provisions the login, activates the package, seeds the compliance checklist and raises the initial requests."
        />
      </div>

      <OnboardClientWizard packages={packages} lineItems={lineItems} workGroups={groupRes.data ?? []} />
    </div>
  );
}
