import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Reports · BluBook" };
export const dynamic = "force-dynamic";

// The reporting views, laid out like the Transact submissions so the two
// landing pages read the same way.
const REPORTS: {
  number: string;
  title: string;
  copy: string;
  scope: string;
  href: Route;
}[] = [
  {
    number: "01",
    title: "Service Request Tracker",
    copy: "Every request with its status, work group, SLA timing and operational detail.",
    scope: "Full request history",
    href: "/dashboard/reports/requests",
  },
  {
    number: "02",
    title: "Performance Dashboards",
    copy: "Delivery performance across your requests, by status and completion against SLA.",
    scope: "Trends and SLA outcomes",
    href: "/dashboard/reports/performance",
  },
];

export default async function ReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type === "staff") redirect("/dashboard");

  const isProvider = profile.user_type === "service_provider";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Reports"
        title="Reports"
        description={
          isProvider
            ? "Review the work assigned to your practice and how it is performing against SLA."
            : "Track every request raised by your business and how it is performing against SLA."
        }
      />

      <ul className="grid border-l border-t border-ink sm:grid-cols-2">
        {REPORTS.map((item) => (
          <li key={item.number} className="border-b border-r border-ink">
            <Link
              href={item.href}
              className="flex h-full flex-col bg-paper p-6 transition-colors hover:bg-cream/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-rust"
            >
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-rust">
                {item.number}
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
