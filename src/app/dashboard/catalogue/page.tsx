import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/Editorial";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { requireStaffRole } from "@/services/staffRole";
import { setPackageActive } from "@/features/catalogue/actions";
import {
  PackageEditorDialog,
  type EditorLineItem,
  type EditorPackage,
  type EditorService,
} from "@/features/catalogue/PackageEditorDialog";
import { } from "@/features/dashboard/ui";

export const metadata: Metadata = { title: "Service catalogue · BluBook" };
export const dynamic = "force-dynamic";

const INTERVAL_LABEL: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
  one_time: "One-time",
};

interface PackageRow {
  id: string;
  name: string;
  slug: string;
  tier: string;
  price: number;
  description: string | null;
  billing_interval: string;
  active: boolean;
  package_line_items: { line_item_id: string }[];
}

export default async function CataloguePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (await requireStaffRole("sales_admin")) redirect("/dashboard");

  const supabase = await createClient();
  const [packagesResult, lineItemsResult, servicesResult] = await Promise.all([
    supabase
      .from("packages")
      .select(
        "id,name,slug,tier,price,description,billing_interval,active,package_line_items(line_item_id)",
      )
      .order("tier")
      .order("price")
      .returns<PackageRow[]>(),
    supabase
      .from("line_items")
      .select("id,name,tier,price,fulfilment_mode,services(name)")
      .eq("active", true)
      .order("name")
      .returns<
        {
          id: string;
          name: string;
          tier: string;
          price: number;
          fulfilment_mode: string;
          services: { name: string } | null;
        }[]
      >(),
    supabase
      .from("services")
      .select("id,name")
      .eq("active", true)
      .order("name")
      .returns<EditorService[]>(),
  ]);

  const lineItems: EditorLineItem[] = (lineItemsResult.data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    tier: item.tier,
    price: item.price,
    serviceName: item.services?.name ?? "—",
    fulfilmentMode: item.fulfilment_mode,
  }));
  const services = servicesResult.data ?? [];

  const packages = packagesResult.data ?? [];
  const toEditor = (row: PackageRow): EditorPackage => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    tier: row.tier,
    price: row.price,
    description: row.description,
    billing_interval: row.billing_interval,
    lineItemIds: row.package_line_items.map((link) => link.line_item_id),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Service catalogue"
        title="Packages"
        description="The standard packages staff assemble during onboarding. Retire a package to keep it off new onboardings without touching existing clients."
        action={
          <PackageEditorDialog lineItems={lineItems} services={services} trigger={{ label: "New package" }} />
        }
      />

      <div className="mt-8 border border-ink bg-paper-light">
        {packages.length === 0 ? (
          <p className="border-l-[3px] border-sun bg-paper px-4 py-3 font-body text-sm text-ink/65">
            No packages yet. Create the first one to make it available in onboarding.
          </p>
        ) : (
          <ul>
            {packages.map((row) => (
              <li
                key={row.id}
                className={`flex flex-wrap items-center gap-4 border-b border-ink px-5 py-4 last:border-b-0 ${
                  row.active ? "" : "bg-paper/60"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-heading text-lg font-normal text-ink">{row.name}</span>
                    <StatusLabel status={row.active ? "active" : "suspended"} />
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink/55">
                    {row.slug} · {row.tier} · {INTERVAL_LABEL[row.billing_interval] ?? row.billing_interval} ·{" "}
                    {row.package_line_items.length} line item
                    {row.package_line_items.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <PackageEditorDialog
                    lineItems={lineItems}
                    services={services}
                    editing={toEditor(row)}
                    trigger={{ label: "Edit", variant: "secondary" }}
                  />
                  <form action={setPackageActive}>
                    <input type="hidden" name="packageId" value={row.id} />
                    <input type="hidden" name="active" value={row.active ? "false" : "true"} />
                    <button
                      type="submit"
                      className="font-body text-sm text-ink/65 underline-offset-4 hover:text-ink hover:underline"
                    >
                      {row.active ? "Retire" : "Restore"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
