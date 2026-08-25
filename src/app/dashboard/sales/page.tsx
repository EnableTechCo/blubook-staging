import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { WorkspaceActionCard } from "@/components/ui/WorkspaceActionCard";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Sales · BluBook" };
export const dynamic = "force-dynamic";

// This page used to redirect straight to Pipeline, which left the rest
// reachable only from a sidebar dropdown. They are cards here instead, laid
// out like Transact and Reports.
//
// Reporting is not among them: Sales is where a client works its pipeline, and
// Reports is where it reads how that work is going. The phasing charts live
// under Reports as Sales Reports.
const SECTIONS: { title: string; copy: string; scope: string; href: Route }[] = [
  {
    title: "Pipeline",
    copy: "Create and maintain the opportunities your business is working, before a sales order is raised.",
    scope: "Open opportunities",
    href: "/dashboard/sales/pipeline",
  },
  {
    title: "Bookings",
    copy: "Work that has been delivered and invoiced, with its payment position.",
    scope: "Booked and closed",
    href: "/dashboard/sales/bookings",
  },
  {
    title: "Targets",
    copy: "The revenue you are aiming for each quarter, and the weeks you want shaped differently.",
    scope: "Quarterly and weekly",
    href: "/dashboard/sales/targets",
  },
  {
    title: "Product list",
    copy: "What you sell, at your prices. Quotations are built from this list.",
    scope: "Upload a price list or maintain it product by product",
    href: "/dashboard/sales/products",
  },
];

export default async function SalesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        title="Sales"
        description="Your pipeline, what it has delivered, and the targets it is working towards. Reporting on it lives under Reports."
      />

      <ul className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((item, index) => (
          <WorkspaceActionCard
            key={item.href}
            index={index + 1}
            title={item.title}
            description={item.copy}
            meta={item.scope}
            href={item.href}
          />
        ))}
      </ul>
    </div>
  );
}
