import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
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
        {SECTIONS.map((item) => (
          <li key={item.href} className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/75 shadow-surface">
            <Link
              href={item.href}
              className="flex h-full flex-col bg-paper-light/70 p-6 transition-[background-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-cobalt-wash/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cobalt"
            >
              <span className="block font-heading text-[1.65rem] font-normal leading-tight text-ink">
                {item.title}
              </span>
              <span className="mt-3 block text-[13px] leading-6 text-ink/60">{item.copy}</span>
              <span className="mt-6 block border-t border-ink pt-3 text-[9px] uppercase tracking-[0.14em] text-ink/50">
                {item.scope}
              </span>
              <span className="mt-5 text-[12px] font-semibold text-ink">
                Open <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
