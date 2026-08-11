import type { SalesDashSummary } from "@/features/sales/phasing";
import { SAST_LOCALE } from "@/lib/time";

const money = new Intl.NumberFormat(SAST_LOCALE, {
  style: "currency",
  currency: "ZAR",
  notation: "compact",
  maximumFractionDigits: 1,
});

function Tile({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-b border-r border-ink bg-paper-light/70 p-4">
      <p className={`font-heading text-2xl leading-none ${accent ? "text-clay" : "text-ink"}`}>
        {value}
      </p>
      <p className="mt-3 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
        {label}
      </p>
    </div>
  );
}

/**
 * The Sales Dash from the brief: one wide figure for the quarter to date, then
 * the target and what is still in play beneath it.
 *
 * Week numbers are shown on the tiles because the brief's mock does, and
 * because "Commit R180K" means something different in week 2 than in week 12.
 */
export function SalesDashCard({
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
    <section className="border-t border-ink bg-paper">
      <div className="border-b border-ink px-5 py-5 sm:px-6">
        <h2 className="font-heading text-[1.65rem] font-normal leading-none tracking-[-0.02em] text-ink">
          Sales Dash
        </h2>
        <p className="mt-2 text-xs leading-5 text-ink/55">
          Q{fiscalQuarter} · {isCurrentQuarter ? `week ${week} of 13` : "full quarter"}
        </p>
      </div>

      <div className="border-b border-ink bg-cream/40 px-5 py-6 sm:px-6">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
          QTD sales phasing
        </p>
        <p className="mt-3 font-heading text-5xl leading-none text-ink">
          {money.format(summary.quarterToDate)}
        </p>
        <p className="mt-3 text-xs leading-5 text-ink/55">
          {summary.hasTarget
            ? `${Math.round((summary.quarterToDate / Math.max(summary.quarterTarget, 1)) * 100)}% of the quarter target${isCurrentQuarter ? `, delivered by week ${week}` : ""}.`
            : "Delivered so far this quarter. Set a target to measure it against."}
        </p>
      </div>

      <div className="grid grid-cols-1 border-l border-ink sm:grid-cols-3 lg:grid-cols-5">
        <Tile
          label="QTR target"
          value={summary.hasTarget ? money.format(summary.quarterTarget) : "—"}
        />
        <Tile label={`${scope} slipped`} value={money.format(summary.slipped)} accent />
        <Tile label={`${scope} commit`} value={money.format(summary.commit)} />
        <Tile label={`${scope} best case`} value={money.format(summary.bestCase)} />
        <Tile label={`${scope} upside`} value={money.format(summary.upside)} />
      </div>
    </section>
  );
}
