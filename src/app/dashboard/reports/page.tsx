import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { WorkspaceActionCard } from "@/components/ui/WorkspaceActionCard";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Reports · BluBook" };
export const dynamic = "force-dynamic";

interface ReportCard {
  title: string;
  copy: string;
  scope: string;
  href: Route;
  // Sales is a client-only workspace, so its entry is hidden from partners
  // rather than leading them to a page that redirects.
  clientOnly?: boolean;
}

// The reporting views, laid out like the Transact submissions so the two
// landing pages read the same way.
//
// Sales reporting lives here rather than in the Sales workspace: Sales is
// where a client works its pipeline, Reports is where it reads how that work
// is going. The phasing charts were on the wrong side of that line.
const REPORTS: ReportCard[] = [
  {
    title: "Service Request Tracker",
    copy: "Every request with its status, work group, SLA timing and operational detail.",
    scope: "Full request history",
    href: "/dashboard/reports/requests",
  },
  {
    title: "Performance Dashboard",
    copy: "Pipeline by status, demand by service, turnaround and SLA performance.",
    scope: "Request-level detail",
    href: "/dashboard/reports/performance",
  },
  {
    title: "Sales Reports",
    copy: "Your pipeline phased across the quarter, measured against the target you set.",
    scope: "Charts and phasing",
    href: "/dashboard/reports/sales",
    clientOnly: true,
  },
];

export default async function ReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type === "staff") redirect("/dashboard");

  const isProvider = profile.user_type === "service_provider";
  const reports = REPORTS.filter((item) => !(item.clientOnly && isProvider));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        title="Reports"
        description={
          isProvider
            ? "Review the work assigned to your practice and how it is performing against SLA."
            : "Track every request raised by your business and how it is performing against SLA."
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((item, index) => (
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
