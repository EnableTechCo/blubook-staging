import type { ClientDashboardData } from "@/services/dashboard";
import { Badge, WorkspaceHeader } from "@/features/dashboard/ui";
import { ClientArtwork } from "@/features/dashboard/ClientArtwork";
import { MetricLegend } from "@/features/dashboard/MetricLegend";
import { SalesDashboardCard } from "@/features/sales/SalesDashboardCard";
import { COMPUTED_METRIC_DEFINITIONS, summariseQuarter } from "@/features/sales/phasing";
import { OperationsDashboardCard } from "@/features/operations/OperationsDashboardCard";
import { FinanceDashboardCard } from "@/features/finance/FinanceDashboardCard";
import { financeMetrics } from "@/features/finance/ratios";
import type { ClientFinanceData } from "@/features/finance/queries";
import { ComplianceCard } from "@/features/compliance/ComplianceCard";
import type { ComplianceData } from "@/features/compliance/queries";
import { currentWeekWindow, OPERATIONS_METRICS } from "@/features/operations/metrics";
import type { SalesPerformanceData } from "@/features/sales/types";
import { BusinessPulse } from "@/features/dashboard/BusinessPulse";

export function ClientDashboard({
  data,
  performance,
  financials,
  compliance,
}: {
  data: ClientDashboardData;
  performance: SalesPerformanceData;
  financials: ClientFinanceData;
  compliance: ComplianceData;
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

  const financeLegend = financeMetrics(financials.weeks).map((metric) => ({
    term: metric.label,
    definition: metric.definition,
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
              className="workspace-panel w-full sm:w-56 lg:w-72"
            >
              <div className="border-b border-ink/8">
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

      <BusinessPulse
        title="Your quarter, in one view"
        description="Sales, delivery and finance indicators are kept together here so you can see what needs a decision before moving into the detailed workspaces."
        items={[
          {
            label: "Sales week",
            value: `${performance.throughWeek}/13`,
            detail: `Q${performance.fiscalQuarter} reporting window`,
          },
          {
            label: "Open work",
            value: requests.filter((request) => request.status !== "completed").length,
            detail: "Requests currently in motion",
            tone: "attention",
          },
          {
            label: "Finance filings",
            value: financials.weeks.length,
            detail: "Weeks reported this quarter",
            tone: financials.weeks.length > 0 ? "positive" : "default",
          },
        ]}

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

      {/* The brief's Finance Dash. Its figures come from the client's finance
          partner rather than from anything BluBook observes, so the card says
          plainly when none have been filed. */}
      <FinanceDashboardCard
        weeks={financials.weeks}
        fiscalQuarter={financials.fiscalQuarter}
        settings={compliance.settings}
      />

      <MetricLegend entries={financeLegend} summary="Legend — what the finance figures mean" />

      {/* The compliance ratio reads the finance figures above it, so it sits
          directly beneath them: the score and its working in one glance. */}
      <ComplianceCard result={compliance.result} fiscalQuarter={compliance.fiscalQuarter} />

    </div>
  );
}
