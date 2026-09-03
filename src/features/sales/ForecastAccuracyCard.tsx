import type { ForecastAccuracySummary } from "@/features/sales/forecastAccuracy";

function varianceLabel(value: number | null): string {
  if (value === null) return "—";
  const days = Math.abs(value).toFixed(1).replace(/\.0$/, "");
  if (value === 0) return "On forecast";
  return `${days} day${days === "1" ? "" : "s"} ${value > 0 ? "late" : "early"}`;
}

export function ForecastAccuracyCard({ summary }: { summary: ForecastAccuracySummary }) {
  const rate = summary.onTimeRate === null ? null : Math.round(summary.onTimeRate * 100);

  return (
    <section className="workspace-panel">
      <div className="workspace-panel-header">
        <div>
          <h2 className="workspace-panel-title">Forecast accuracy</h2>
          <p className="workspace-panel-subtitle">
            Actual booking dates compared with each opportunity&apos;s forecast fiscal week.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3">
        <div className="workspace-metric-cell border-b border-r sm:col-span-1">
          <p className="workspace-metric-value text-3xl text-ink" data-workspace-number>
            {rate === null ? "—" : `${rate}%`}
          </p>
          <p className="workspace-metric-label text-cobalt">On-time forecast rate</p>
        </div>
        <div className="workspace-metric-cell border-b border-r">
          <p className="workspace-metric-value text-2xl text-ink" data-workspace-number>
            {varianceLabel(summary.averageVarianceDays)}
          </p>
          <p className="workspace-metric-label text-cobalt">Average schedule variance</p>
        </div>
        <div className="workspace-metric-cell border-b border-r">
          <p className="workspace-metric-value text-2xl text-ink" data-workspace-number>
            {summary.measuredBookings}
          </p>
          <p className="workspace-metric-label text-cobalt">Bookings measured</p>
        </div>
      </div>

      <p className="px-5 py-4 text-[13px] leading-6 text-ink/60">
        {summary.measuredBookings === 0
          ? "No booked opportunities in this quarter have both a forecast week and an actual booking date yet."
          : `${summary.onTimeBookings} of ${summary.measuredBookings} bookings landed on or before the end of their forecast week.`}
      </p>
    </section>
  );
}
