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
    <details className="workspace-panel workspace-context-list">
      <summary className="workspace-context-list__summary cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span>{summary}</span>
        <span className="workspace-context-list__count">{entries.length + categories.length} terms</span>
        <span className="workspace-context-list__chevron" aria-hidden="true">⌄</span>
      </summary>

      <dl className="workspace-context-list__rows">
        {entries.map((entry) => (
          <div key={entry.term} className="workspace-context-list__row">
            <dt className="text-[13px] font-semibold leading-tight text-ink">
              {entry.term}
              {entry.provisional ? (
                <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink/40">
                  draft
                </span>
              ) : null}
            </dt>
            <dd className="text-[12px] leading-5 text-ink/60">{entry.definition}</dd>
          </div>
        ))}

        {categories.map((category) => (
          <div key={category.code} className="workspace-context-list__row">
            <dt className="text-[13px] font-semibold leading-tight text-ink">{category.name}</dt>
            <dd className="text-[12px] leading-5 text-ink/60">
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
