import type { ClientDashboardData } from "@/services/dashboard";
import { Badge, WorkspaceHeader } from "@/features/dashboard/ui";
import { ClientArtwork } from "@/features/dashboard/ClientArtwork";
import { RequestPerformanceDashboard } from "@/features/dashboard/RequestPerformanceDashboard";

export function ClientDashboard({ data }: { data: ClientDashboardData }) {
  // Packages are still fetched for the type, but the landing view now leads on
  // delivery performance rather than what was bought. The package itself is
  // visible from the requests it raises.
  const { client, requests } = data;

  return (
    <div className="space-y-8">
      <WorkspaceHeader
        eyebrow="Client workspace"
        title={client?.business_name ?? "Your business"}
        description="A live view of your service requests, delivery progress, turnaround, and SLA performance."
        aside={
          client ? (
            <aside
              aria-label={`${client.business_name} workspace identity`}
              className="w-full border border-ink bg-paper sm:w-56 lg:w-72"
            >
              <div className="border-b border-ink">
                <ClientArtwork
                  businessName={client.business_name}
                  artworkPath={client.artwork_path}
                  prominent
                />
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-ink/55">
                  Company workspace
                </span>
                <Badge status={client.status} />
              </div>
            </aside>
          ) : null
        }
      />

      {/* The same component the Reports performance view renders, so the two
          never drift apart. Its own metric strip replaces the counters that
          used to sit here — "Active workload" already covered them. */}
      <RequestPerformanceDashboard requests={requests} audience="client" />
    </div>
  );
}
