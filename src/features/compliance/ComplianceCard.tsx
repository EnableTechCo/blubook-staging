import type { ComplianceResult, ComplianceWindow } from "@/features/compliance/wcr";

function Window({ label, window }: { label: string; window: ComplianceWindow }) {
  const unmeasured = window.weightTotal - window.weightScored;

  return (
    <div className="border-b border-r border-ink bg-paper-light/70 p-5">
      <p
        className={`font-heading text-4xl leading-none ${
          window.ratio === null
            ? "text-ink/35"
            : window.ratio < 100
              ? "text-negative"
              : "text-positive"
        }`}
      >
        {window.ratio === null ? "—" : `${Math.round(window.ratio)}%`}
      </p>
      <p className="mt-4 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
        {label}
      </p>
      <p className="mt-2 text-[11px] leading-4 text-ink/50">
        {window.ratio === null
          ? "Nothing measurable yet"
          : unmeasured > 0
            ? `${window.weightScored} of ${window.weightTotal} weight scored`
            : "All metrics scored"}
      </p>
    </div>
  );
}

/**
 * The Weighted Compliance Ratio: three numbers, as the brief asks.
 *
 * Underneath sits the working — which metric passed, what it was measured
 * against, and which could not be measured at all. A single percentage with no
 * explanation is a number a client can only dispute, not act on.
 */
export function ComplianceCard({
  result,
  fiscalQuarter,
}: {
  result: ComplianceResult;
  fiscalQuarter: number;
}) {
  return (
    <section className="border-t border-ink bg-paper">
      <div className="border-b border-ink px-5 py-5 sm:px-6">
        <h2 className="font-heading text-[1.65rem] font-normal leading-none tracking-[-0.02em] text-ink">
          Weighted Compliance Ratio
        </h2>
        <p className="mt-2 text-xs leading-5 text-ink/55">
          Q{fiscalQuarter} · the share of the weight your finance metrics carry against the
          thresholds BluBook has set
        </p>
      </div>

      <div className="grid grid-cols-1 border-l border-ink sm:grid-cols-3">
        <Window label="WCR current" window={result.current} />
        <Window label="WCR QTD" window={result.quarterToDate} />
        <Window label="WCR YTD" window={result.yearToDate} />
      </div>

      <details className="border-t border-ink">
        <summary className="cursor-pointer list-none px-5 py-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cobalt hover:bg-cream/40 [&::-webkit-details-marker]:hidden">
          How this quarter&rsquo;s ratio was worked out
        </summary>
        <ul className="border-t border-ink">
          {result.quarterToDate.outcomes.map((outcome) => (
            <li
              key={outcome.key}
              className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink/12 px-5 py-3 text-[13px] last:border-b-0"
            >
              <span className="font-medium text-ink">{outcome.label}</span>
              <span className="text-ink/55">
                {outcome.direction === "higher_is_better" ? "at least" : "at most"}{" "}
                {outcome.threshold} · weight {outcome.weight}
              </span>
              <span
                className={`font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  outcome.achieved === null
                    ? "text-ink/40"
                    : outcome.achieved
                      ? "text-positive"
                      : "text-negative"
                }`}
              >
                {outcome.achieved === null
                  ? "Not measurable"
                  : outcome.achieved
                    ? "Achieved"
                    : "Short"}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
