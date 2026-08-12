import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { RequestPerformanceDashboard } from "@/features/dashboard/RequestPerformanceDashboard";
import { getClientDashboard, getProviderDashboard } from "@/services/dashboard";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Performance Dashboard · BluBook" };
export const dynamic = "force-dynamic";

// The request-level view: pipeline by status, demand by service, turnaround and
// SLA. It briefly lived on the landing page, but the Operations Dashboard now
// reports on the same work from a weekly angle, so this detail belongs back in
// Reports where a reader goes looking for it rather than meeting it on arrival.
export default async function PerformancePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type === "staff") redirect("/dashboard");

  const isProvider = profile.user_type === "service_provider";
  const { requests } = isProvider ? await getProviderDashboard() : await getClientDashboard();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Reports"
        title="Performance Dashboard"
        description={
          isProvider
            ? "How the work assigned to your practice is moving, and how it performs against SLA."
            : "How your requests are moving, which services they draw on, and how they perform against SLA."
        }
      />

      <RequestPerformanceDashboard
        requests={requests}
        audience={isProvider ? "provider" : "client"}
      />
    </div>
  );
}
