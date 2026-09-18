import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingContact } from "@/components/public/LandingContact";
import { LandingFooter } from "@/components/public/LandingFooter";
import { LandingHeader } from "@/components/public/LandingHeader";
import { WorkspaceHeader } from "@/components/ui/Workspace";
import { buttonStyles } from "@/components/ui/Button";
import {
  ClientSignUpWizard,
  type WizardWorkGroup,
} from "@/features/onboarding/OnboardClientWizard";
import type { BuilderLineItem, BuilderPackage } from "@/features/onboarding/PackageBuilder";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Create your Client account · BluBook" };
export const dynamic = "force-dynamic";

type LineItemRow = {
  id: string;
  name: string;
  tier: string;
  price: number;
  services: { name: string; service_groups: { slug: string; name: string } | null } | null;
};

export default async function SignUpPage() {
  if (await getCurrentProfile()) redirect("/dashboard");

  // Signup is public, while the catalogue is authenticated reference data.
  // Read only active, client-selectable records through the server and send the
  // minimum fields the wizard needs to the browser.
  const admin = createAdminClient();
  const [pkgRes, itemRes, groupRes] = await Promise.all([
    admin
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
    admin
      .from("line_items")
      .select("id,name,tier,price,services(name,service_groups(slug,name))")
      .eq("active", true)
      .order("name")
      .returns<LineItemRow[]>(),
    admin
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
    <div className="min-h-screen bg-paper text-ink">
      <LandingHeader />
      <main className="px-5 pb-24 pt-32 lg:px-7 lg:pt-36">
        <div className="mx-auto max-w-6xl">
          <WorkspaceHeader
            eyebrow="Client account setup"
            title="Create your BluBook account"
            description="Tell us about your business, choose the services you need, and create your own secure login. Your workspace is prepared as soon as you submit the completed setup."
            aside={
              <Link href="/login/client" className={buttonStyles({ variant: "secondary" })}>
                Already have an account? Sign in
              </Link>
            }
          />
          <ClientSignUpWizard
            packages={packages}
            lineItems={lineItems}
            workGroups={groupRes.data ?? []}
          />
        </div>
      </main>
      <LandingContact />
      <LandingFooter />
    </div>
  );
}
