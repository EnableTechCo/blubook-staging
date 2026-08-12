import type { ClientDashboardData } from "@/services/dashboard";
import { Badge, WorkspaceHeader } from "@/features/dashboard/ui";
import { ClientArtwork } from "@/features/dashboard/ClientArtwork";
import { MetricLegend } from "@/features/dashboard/MetricLegend";
import { SalesDashboardCard } from "@/features/sales/SalesDashboardCard";
import { COMPUTED_METRIC_DEFINITIONS, summariseQuarter } from "@/features/sales/phasing";
import { OperationsDashboardCard } from "@/features/operations/OperationsDashboardCard";
import { currentWeekWindow, OPERATIONS_METRICS } from "@/features/operations/metrics";
import type { SalesPerformanceData } from "@/features/sales/types";

export function ClientDashboard({
  data,
  performance,
}: {
  data: ClientDashboardData;
  performance: SalesPerformanceData;
}) {
  // Packages are still fetched for the type, but the landing view leads on the
  // brief's dash cards rather than on what was bought. Request-level detail —
  // pipeline by status, demand by service, SLA — lives in Reports under
  // Performance Dashboard.
  const { client, requests } = data;

  const operationsWindow = currentWeekWindow();
  const operationsLegend = OPERATIONS_METRICS.map((metric) => ({
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
        description="A live view of your sales quarter and how your work is moving through BluBook."
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

      {/* The brief's Ops Dash, named in full here: how the client's work is moving through BluBook,
          rather than what it is worth. Its own legend, because its metrics are
          computed here and several are still awaiting names. */}
      <OperationsDashboardCard requests={requests} window={operationsWindow} />

      <MetricLegend
        entries={operationsLegend}
        summary="Legend — what the operations figures mean"
      />

    </div>
  );
}
