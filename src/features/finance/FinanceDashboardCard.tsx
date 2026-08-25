import { financeMetrics, type FinanceMetric, type WeeklyFinancials } from "@/features/finance/ratios";
import type { MetricSetting } from "@/features/compliance/wcr";
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

/**
 * Whether a figure is good or bad, judged against the same threshold the
 * compliance ratio uses. Colour and score therefore always agree: a tile can
 * never read green on a metric the ratio counted as short.
 *
 * Neutral where staff have set no threshold for a metric, because "good" is
 * then somebody's opinion rather than a decision anyone has recorded.
 */
function verdict(
  metric: FinanceMetric,
  settings: MetricSetting[],
): "good" | "bad" | "neutral" {
  if (metric.value === null) return "neutral";
  const setting = settings.find((entry) => entry.metric_key === metric.key && entry.active);
  if (!setting) return "neutral";
  const met =
    setting.direction === "higher_is_better"
      ? metric.value >= Number(setting.threshold)
      : metric.value <= Number(setting.threshold);
  return met ? "good" : "bad";
}

const valueTone = {
  good: "text-positive",
  bad: "text-negative",
  neutral: "text-ink",
} as const;

function Tile({ metric, settings }: { metric: FinanceMetric; settings: MetricSetting[] }) {
  const tone = verdict(metric, settings);
  return (
    <div className="workspace-metric-cell border-b border-r">
      <p
        className={`workspace-metric-value text-2xl ${metric.value === null ? "text-ink/35" : valueTone[tone]}`}
        data-workspace-number
      >
        {render(metric)}
      </p>
      <p className="workspace-metric-label text-cobalt">{metric.label}</p>
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
  settings = [],
}: {
  weeks: WeeklyFinancials[];
  fiscalQuarter: number;
  settings?: MetricSetting[];
}) {
  const metrics = financeMetrics(weeks);
  const hero = metrics[0]!;
  const rest = metrics.slice(1);
  const heroTone = verdict(hero, settings);

  return (
    <section className="workspace-panel">
      <div className="workspace-panel-header">
        <div>
          <h2 className="workspace-panel-title">Finance Dashboard</h2>
          <p className="workspace-panel-subtitle">
          Q{fiscalQuarter} ·{" "}
          {weeks.length === 0
            ? "awaiting figures from your finance partner"
            : `${weeks.length} week${weeks.length === 1 ? "" : "s"} filed this quarter`}
          </p>
        </div>
      </div>

      <div className="workspace-metric-hero">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
          {hero.label}
        </p>
        <p
          className={`workspace-metric-hero-value ${hero.value === null ? "text-ink/35" : valueTone[heroTone]}`}
          data-workspace-number
        >
          {render(hero)}
        </p>
        <p className="mt-3 text-xs leading-5 text-ink/55">
          {hero.value === null
            ? "Your finance partner has not filed figures for this quarter yet."
            : hero.basis}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5">
        {rest.map((metric) => (
          <Tile key={metric.key} metric={metric} settings={settings} />
        ))}
      </div>
    </section>
  );
}
