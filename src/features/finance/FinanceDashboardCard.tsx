import { financeMetrics, type FinanceMetric, type WeeklyFinancials } from "@/features/finance/ratios";
import { SAST_LOCALE } from "@/lib/time";

const money = new Intl.NumberFormat(SAST_LOCALE, {
  style: "currency",
  currency: "ZAR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const ratio = new Intl.NumberFormat(SAST_LOCALE, { maximumFractionDigits: 2 });

function render(metric: FinanceMetric): string {
  if (metric.value === null) return "—";
  if (metric.format === "currency") return money.format(metric.value);
  if (metric.format === "percentage") return `${Math.round(metric.value)}%`;
  return ratio.format(metric.value);
}

function Tile({ metric }: { metric: FinanceMetric }) {
  return (
    <div className="border-b border-r border-ink bg-paper-light/70 p-4">
      <p
        className={`font-heading text-2xl leading-none ${metric.value === null ? "text-ink/35" : "text-ink"}`}
      >
        {render(metric)}
      </p>
      <p className="mt-3 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
        {metric.label}
      </p>
      <p className="mt-2 text-[11px] leading-4 text-ink/50">{metric.basis}</p>
    </div>
  );
}

/**
 * The brief's Finance Dash: operating cash flow as the headline, then the five
 * ratios beneath it.
 *
 * Every figure comes from what the client's finance partner filed. Where a week
 * has not been filed the tile says so rather than showing zero — a business
 * with no reported figures has not reported nothing, it has reported nothing
 * yet, and the two look identical if you print a zero.
 */
export function FinanceDashboardCard({
  weeks,
  fiscalQuarter,
}: {
  weeks: WeeklyFinancials[];
  fiscalQuarter: number;
}) {
  const metrics = financeMetrics(weeks);
  const hero = metrics[0]!;
  const rest = metrics.slice(1);

  return (
    <section className="border-t border-ink bg-paper">
      <div className="border-b border-ink px-5 py-5 sm:px-6">
        <h2 className="font-heading text-[1.65rem] font-normal leading-none tracking-[-0.02em] text-ink">
          Finance Dashboard
        </h2>
        <p className="mt-2 text-xs leading-5 text-ink/55">
          Q{fiscalQuarter} ·{" "}
          {weeks.length === 0
            ? "awaiting figures from your finance partner"
            : `${weeks.length} week${weeks.length === 1 ? "" : "s"} filed this quarter`}
        </p>
      </div>

      <div className="border-b border-ink bg-cream/40 px-5 py-6 sm:px-6">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
          {hero.label}
        </p>
        <p
          className={`mt-3 font-heading text-5xl leading-none ${hero.value === null ? "text-ink/35" : "text-ink"}`}
        >
          {render(hero)}
        </p>
        <p className="mt-3 text-xs leading-5 text-ink/55">
          {hero.value === null
            ? "Your finance partner has not filed figures for this quarter yet."
            : hero.basis}
        </p>
      </div>

      <div className="grid grid-cols-1 border-l border-ink sm:grid-cols-3 lg:grid-cols-5">
        {rest.map((metric) => (
          <Tile key={metric.key} metric={metric} />
        ))}
      </div>
    </section>
  );
}
