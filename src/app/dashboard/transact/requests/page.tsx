import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RequestsTable } from "@/features/dashboard/RequestsTable";
import { Section, WorkspaceHeader } from "@/features/dashboard/ui";
import { ProviderRequestActions } from "@/features/requests/ProviderRequestActions";
import { getClientDashboard, getProviderDashboard } from "@/services/dashboard";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Service Request Tracker · BluBook" };
export const dynamic = "force-dynamic";

export default async function RequestTrackerPage() {
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
        title="Service Request Tracker"
        description={
          isProvider
            ? "Review assigned work, operational timing, SLA performance, and requests raised by your practice."
            : "Track every request raised from your service packages or submitted directly by your business."
        }
      />
      <Section
        title={isProvider ? "Assigned service requests" : "All service requests"}
        subtitle={`${requests.length} request${requests.length === 1 ? "" : "s"} ${
          isProvider ? "visible to your practice" : "in your workspace"
        }`}
      >
        <RequestsTable
          rows={requests}
          view={isProvider ? "provider" : "client"}
          renderActions={
            isProvider
              ? (request) => <ProviderRequestActions request={request} />
              : undefined
          }
        />
      </Section>
    </div>
  );
}
