import "server-only";
import type { Admin } from "@/features/onboarding/onboardClientSteps";
import type { BuilderLineItem, BuilderPackage } from "@/features/onboarding/PackageBuilder";

/**
 * What the onboarding wizard offers: active packages with their line items,
 * the active line items that can be added to make a Flex package, and the
 * partner-facing work groups whose intake stages the wizard can show.
 *
 * The invite page reads this for someone who is not signed in, and the
 * catalogue tables admit only authenticated readers, so it takes the admin
 * client — and returns only what the wizard renders. Prices are left out on
 * purpose: the wizard never shows one, and the page is reachable by anyone
 * holding a link.
 */

type LineItemRow = {
  id: string;
  name: string;
  tier: string;
  services: { name: string; service_groups: { slug: string; name: string } | null } | null;
};

export interface OnboardingCatalogue {
  packages: BuilderPackage[];
  lineItems: BuilderLineItem[];
  workGroups: { slug: string; name: string }[];
}

export async function loadOnboardingCatalogue(admin: Admin): Promise<OnboardingCatalogue> {
  const [pkgRes, itemRes, groupRes] = await Promise.all([
    admin
      .from("packages")
      .select("id,name,tier,package_line_items(line_items(id,name,tier,services(name,service_groups(slug,name))))")
      .eq("active", true)
      .order("price")
      .returns<{ id: string; name: string; tier: string; package_line_items: { line_items: LineItemRow | null }[] }[]>(),
    admin
      .from("line_items")
      .select("id,name,tier,services(name,service_groups(slug,name))")
      .eq("active", true)
      .order("name")
      .returns<LineItemRow[]>(),
    // Sales Operations is BluBook's own desk and has no intake of its own.
    admin
      .from("service_groups")
      .select("slug,name")
      .eq("active", true)
      .eq("internal", false)
      .order("name")
      .returns<{ slug: string; name: string }[]>(),
  ]);

  return {
    packages: (pkgRes.data ?? []).map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      tier: pkg.tier,
      items: pkg.package_line_items
        .map((packageLineItem) => packageLineItem.line_items)
        .filter((lineItem): lineItem is LineItemRow => Boolean(lineItem))
        .map((lineItem) => ({
          id: lineItem.id,
          name: lineItem.name,
          tier: lineItem.tier,
          workGroupSlug: lineItem.services?.service_groups?.slug ?? null,
        })),
    })),
    lineItems: (itemRes.data ?? []).map((lineItem) => ({
      id: lineItem.id,
      name: lineItem.name,
      tier: lineItem.tier,
      serviceName: lineItem.services?.name ?? "—",
      workGroupName: lineItem.services?.service_groups?.name ?? null,
      workGroupSlug: lineItem.services?.service_groups?.slug ?? null,
    })),
    workGroups: groupRes.data ?? [],
  };
}
