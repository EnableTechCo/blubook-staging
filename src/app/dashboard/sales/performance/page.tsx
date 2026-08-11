import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Empty, WorkspaceHeader } from "@/features/dashboard/ui";
import { PhasingChart } from "@/features/sales/PhasingChart";
import { MetricLegend } from "@/features/sales/MetricLegend";
import { SalesDashboardCard } from "@/features/sales/SalesDashboardCard";
import { buildPhasingSeries, MEASURES, summariseQuarter } from "@/features/sales/phasing";
import { getSalesPerformance } from "@/features/sales/queries";
import { FISCAL_QUARTERS } from "@/lib/time";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Sales Performance · BluBook" };
export const dynamic = "force-dynamic";

export default async function SalesPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; quarter?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard");

  const { year, quarter } = await searchParams;
  const data = await getSalesPerformance(
    year ? Number(year) : undefined,
    quarter ? Number(quarter) : undefined,
  );

  const summary = summariseQuarter({
    opportunities: data.opportunities,
    fiscalYear: data.fiscalYear,
    fiscalQuarter: data.fiscalQuarter,
    throughWeek: data.throughWeek,
    target: data.target,
  });

  return (
    <div className="mx-auto max-w-[80rem] space-y-8">
      <WorkspaceHeader
        eyebrow="Sales"
        title="Performance"
        description="Your pipeline phased across the thirteen weeks of the quarter, measured against the target you set."
      />

      <nav aria-label="Choose a quarter" className="flex flex-wrap items-center gap-2">
        <span className="mr-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/50">
          FY{data.fiscalYear}
        </span>
        {Array.from({ length: FISCAL_QUARTERS }, (_, index) => index + 1).map((option) => {
          const selected = option === data.fiscalQuarter;
          return (
            <Link
              key={option}
              href={`/dashboard/sales/performance?year=${data.fiscalYear}&quarter=${option}`}
              aria-current={selected ? "page" : undefined}
              className={`border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                selected
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/35 bg-paper text-ink hover:border-ink"
              }`}
            >
              Q{option}
            </Link>
          );
        })}
      </nav>

      {data.error ? (
        <div role="alert" className="border-l-4 border-clay bg-clay/10 px-5 py-4">
          <p className="font-semibold">Performance data could not be loaded.</p>
          <p className="mt-1 text-sm text-ink/60">{data.error}</p>
        </div>
      ) : (
        <>
          <SalesDashboardCard
            summary={summary}
            fiscalQuarter={data.fiscalQuarter}
            week={data.throughWeek}
            isCurrentQuarter={data.isCurrentQuarter}
          />

          <MetricLegend categories={data.categories} />

          {data.opportunities.length === 0 ? (
            <Empty>
              No pipeline records fall in Q{data.fiscalQuarter} FY{data.fiscalYear}. Opportunities
              carry the quarter you give them on the Pipeline page.
            </Empty>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {MEASURES.map((measure) => (
                <PhasingChart
                  key={measure.key}
                  title={measure.label}
                  description={measure.description}
                  series={buildPhasingSeries({
                    opportunities: data.opportunities,
                    measure,
                    fiscalYear: data.fiscalYear,
                    fiscalQuarter: data.fiscalQuarter,
                    throughWeek: data.throughWeek,
                    target: data.target,
                  })}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
