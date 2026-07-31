import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RequestPerformanceDashboard } from "@/features/dashboard/RequestPerformanceDashboard";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { getClientDashboard, getProviderDashboard } from "@/services/dashboard";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Request Performance · BluBook" };
export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type === "staff") redirect("/dashboard");

  const isProvider = profile.user_type === "service_provider";
  const { requests } = isProvider
    ? await getProviderDashboard()
    : await getClientDashboard();

  return (
    <div className="mx-auto max-w-[96rem] space-y-8">
      <WorkspaceHeader
        eyebrow="Transact"
        title="Performance Dashboards"
        description={
          isProvider
            ? "A live delivery view of assigned volume, request progress, turnaround, and SLA performance."
            : "A live operational view of service-request volume, delivery progress, turnaround, and SLA performance."
        }
      />
      <RequestPerformanceDashboard
        requests={requests}
        audience={isProvider ? "provider" : "client"}
      />
    </div>
  );
}
