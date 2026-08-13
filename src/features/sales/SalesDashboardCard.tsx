import type { SalesDashSummary } from "@/features/sales/phasing";
import { SAST_LOCALE } from "@/lib/time";

const money = new Intl.NumberFormat(SAST_LOCALE, {
  style: "currency",
  currency: "ZAR",
  notation: "compact",
  maximumFractionDigits: 1,
});

function Tile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "bad";
}) {
  return (
    <div className="border-b border-r border-ink/8 bg-paper-light/65 p-4">
      <p
        className={`font-heading text-2xl leading-none ${tone === "bad" ? "text-negative" : "text-ink"}`}
      >
        {value}
      </p>
      <p className="mt-3 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
        {label}
      </p>
    </div>
  );
}

/**
 * The Sales Dashboard from the brief: one wide figure for the quarter to date, then
 * the target and what is still in play beneath it.
 *
 * Week numbers are shown on the tiles because the brief's mock does, and
 * because "Commit R180K" means something different in week 2 than in week 12.
 */
export function SalesDashboardCard({
  summary,
  fiscalQuarter,
  week,
  isCurrentQuarter = true,
}: {
  summary: SalesDashSummary;
  fiscalQuarter: number;
  week: number;
  isCurrentQuarter?: boolean;
}) {
  // "Week 11 commit" is the brief's wording and is right for the quarter in
  // progress. For any other quarter there is no current week to name, so the
  // tiles describe the quarter as a whole instead.
  const scope = isCurrentQuarter ? `Week ${week}` : "Quarter";
  return (
    <section className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/78 shadow-surface">
      <div className="border-b border-ink/8 bg-paper-light/55 px-5 py-5 sm:px-6">
        <h2 className="font-heading text-[1.65rem] font-normal leading-none tracking-[-0.02em] text-ink">
          Sales Dashboard
        </h2>
        <p className="mt-2 text-xs leading-5 text-ink/55">
          Q{fiscalQuarter} · {isCurrentQuarter ? `week ${week} of 13` : "full quarter"}
        </p>
      </div>

      <div className="border-b border-ink/8 bg-cobalt-wash/45 px-5 py-6 sm:px-6">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
          QTD sales phasing
        </p>
        <p
          className={`mt-3 font-heading text-5xl leading-none ${
            !summary.hasTarget || summary.quarterTarget === 0
              ? "text-ink"
              : summary.quarterToDate >= (summary.quarterTarget * week) / 13
                ? "text-positive"
                : "text-negative"
          }`}
        >
          {money.format(summary.quarterToDate)}
        </p>
        <p className="mt-3 text-xs leading-5 text-ink/55">
          {summary.hasTarget
            ? `${Math.round((summary.quarterToDate / Math.max(summary.quarterTarget, 1)) * 100)}% of the quarter target${isCurrentQuarter ? `, delivered by week ${week}` : ""}.`
            : "Delivered so far this quarter. Set a target to measure it against."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5">
        <Tile
          label="QTR target"
          value={summary.hasTarget ? money.format(summary.quarterTarget) : "—"}
        />
        {/* Slipped revenue is the one figure here that is bad by definition:
            work that was expected by now and has not landed. Zero is not bad,
            so it stays neutral. */}
        <Tile
          label={`${scope} slipped`}
          value={money.format(summary.slipped)}
          tone={summary.slipped > 0 ? "bad" : "neutral"}
        />
        <Tile label={`${scope} commit`} value={money.format(summary.commit)} />
        <Tile label={`${scope} best case`} value={money.format(summary.bestCase)} />
        <Tile label={`${scope} upside`} value={money.format(summary.upside)} />
      </div>
    </section>
  );
}
