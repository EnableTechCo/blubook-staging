import type { ForecastCategory } from "@/features/sales/types";

export interface LegendEntry {
  term: string;
  definition: string;
  /** Marked in the legend, so a placeholder is never mistaken for a decision. */
  provisional?: boolean;
}

/**
 * What every figure on the dashboard means.
 *
 * Forecast categories come from the database, seeded from the workbook's own
 * Definitions block, so this legend and the Pipeline editor always say the same
 * thing. The computed metrics are defined in code because nothing stores them.
 *
 * A category with no description recorded says so rather than being dropped:
 * a legend that quietly omits a term the client can select is worse than one
 * that admits the gap.
 */
export function MetricLegend({
  entries,
  categories = [],
  summary = "Legend — what these figures mean",
}: {
  entries: LegendEntry[];
  categories?: ForecastCategory[];
  summary?: string;
}) {
  return (
    <details className="workspace-panel">
      <summary className="cursor-pointer list-none px-5 py-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cobalt hover:bg-cream/40 [&::-webkit-details-marker]:hidden">
        {summary}
      </summary>

      <dl className="grid border-t border-ink/8 sm:grid-cols-2">
        {entries.map((entry) => (
          <div key={entry.term} className="border-b border-r border-ink/8 bg-transparent px-5 py-4">
            <dt className="text-sm font-semibold leading-tight text-ink">
              {entry.term}
              {entry.provisional ? (
                <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink/40">
                  draft
                </span>
              ) : null}
            </dt>
            <dd className="mt-2 text-[13px] leading-6 text-ink/60">{entry.definition}</dd>
          </div>
        ))}

        {categories.map((category) => (
          <div key={category.code} className="border-b border-r border-ink/8 bg-transparent px-5 py-4">
            <dt className="text-sm font-semibold leading-tight text-ink">{category.name}</dt>
            <dd className="mt-2 text-[13px] leading-6 text-ink/60">
              {category.description ?? (
                <span className="text-ink/45">No definition recorded yet.</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
