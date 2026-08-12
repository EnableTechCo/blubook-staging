import type { ClientDashboardData } from "@/services/dashboard";
import { Badge, WorkspaceHeader } from "@/features/dashboard/ui";
import { ClientArtwork } from "@/features/dashboard/ClientArtwork";
import { RequestPerformanceDashboard } from "@/features/dashboard/RequestPerformanceDashboard";
import { MetricLegend } from "@/features/dashboard/MetricLegend";
import { SalesDashboardCard } from "@/features/sales/SalesDashboardCard";
import { COMPUTED_METRIC_DEFINITIONS, summariseQuarter } from "@/features/sales/phasing";
import { OpsDashboardCard } from "@/features/ops/OpsDashboardCard";
import { currentWeekWindow, OPS_METRICS } from "@/features/ops/metrics";
import type { SalesPerformanceData } from "@/features/sales/types";

export function ClientDashboard({
  data,
  performance,
}: {
  data: ClientDashboardData;
  performance: SalesPerformanceData;
}) {
  // Packages are still fetched for the type, but the landing view now leads on
  // delivery performance rather than what was bought. The package itself is
  // visible from the requests it raises.
  const { client, requests } = data;

  const opsWindow = currentWeekWindow();
  const opsLegend = OPS_METRICS.map((metric) => ({
    term: metric.label,
    definition: metric.definition,
    provisional: metric.provisional,
  }));

  const salesSummary = summariseQuarter({
    opportunities: performance.opportunities,
    fiscalYear: performance.fiscalYear,
    fiscalQuarter: performance.fiscalQuarter,
    throughWeek: performance.throughWeek,
    target: performance.target,
  });

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

      {/* The Dash Landing Page from the brief leads on sales, with delivery
          performance beneath it. Both read live data; neither is a summary of
          the other. */}
      <SalesDashboardCard
        summary={salesSummary}
        fiscalQuarter={performance.fiscalQuarter}
        week={performance.throughWeek}
        isCurrentQuarter={performance.isCurrentQuarter}
      />

      <MetricLegend entries={COMPUTED_METRIC_DEFINITIONS} categories={performance.categories} />

      {/* The brief's Ops Dash: how the client's work is moving through BluBook,
          rather than what it is worth. Its own legend, because its metrics are
          computed here and several are still awaiting names. */}
      <OpsDashboardCard requests={requests} window={opsWindow} />

      <MetricLegend
        entries={opsLegend}
        summary="Legend — what the operations figures mean"
      />

      {/* The same component the Reports performance view renders, so the two
          never drift apart. Its own metric strip replaces the counters that
          used to sit here — "Active workload" already covered them. */}
      <RequestPerformanceDashboard requests={requests} audience="client" />
    </div>
  );
}
