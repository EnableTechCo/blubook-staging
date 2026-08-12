import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Sales · BluBook" };
export const dynamic = "force-dynamic";

// This page used to redirect straight to Pipeline, which left Bookings,
// Targets and Performance reachable only from a sidebar dropdown. They are
// cards here instead, laid out like Transact and Reports.
const SECTIONS: { title: string; copy: string; scope: string; href: Route }[] = [
  {
    title: "Pipeline",
    copy: "Create and maintain the opportunities your business is working, before a purchase order is raised.",
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
    title: "Performance",
    copy: "Your pipeline phased across the quarter and measured against the target you set.",
    scope: "Charts and phasing",
    href: "/dashboard/sales/performance",
  },
];

export default async function SalesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Sales"
        title="Sales"
        description="Your pipeline, what it has delivered, and how it is tracking against target."
      />

      <ul className="grid border-l border-t border-ink sm:grid-cols-2">
        {SECTIONS.map((item, index) => (
          <li key={item.href} className="border-b border-r border-ink">
            <Link
              href={item.href}
              className="flex h-full flex-col bg-paper p-6 transition-colors hover:bg-cream/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-rust"
            >
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-rust">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-8 block font-heading text-[1.65rem] font-normal leading-tight text-ink">
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
