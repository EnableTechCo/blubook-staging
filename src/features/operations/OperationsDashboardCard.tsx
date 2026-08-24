import { operationsMetric, type WeekWindow } from "@/features/operations/metrics";
import type { RequestRow } from "@/services/dashboard";

// The brief's Ops Dash, named in full here: one headline figure, then a row of five. Which five is
// configuration — these keys are the only thing to change when the metrics are
// renamed or reordered.
const HERO_KEY = "ftc";
const TILE_KEYS = ["open", "on_time", "accepted_first_offer", "overdue"] as const;

function Tile({
  label,
  value,
  basis,
  provisional,
}: {
  label: string;
  value: string | null;
  basis: string;
  provisional: boolean;
}) {
  return (
    <div className="workspace-metric-cell border-b border-r">
      <p className={`workspace-metric-value text-2xl ${value === null ? "text-ink/35" : "text-ink"}`} data-workspace-number>
        {value ?? "—"}
      </p>
      <p className="workspace-metric-label text-cobalt">
        {label}
        {provisional ? <span className="ml-1 text-ink/40">·&nbsp;draft</span> : null}
      </p>
      <p className="mt-2 text-[11px] leading-4 text-ink/50">{basis}</p>
    </div>
  );
}

export function OperationsDashboardCard({
  requests,
  window,
}: {
  requests: RequestRow[];
  window: WeekWindow;
}) {
  const hero = operationsMetric(HERO_KEY);
  const heroResult = hero.compute(requests, window);

  return (
    <section className="workspace-panel">
      <div className="workspace-panel-header">
        <div>
          <h2 className="workspace-panel-title">Operations Dashboard</h2>
          <p className="workspace-panel-subtitle">
          Q{window.quarter} · week {window.quarterWeek} of 13 · how your work is moving through
          BluBook
          </p>
        </div>
      </div>

      <div className="workspace-metric-hero">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
          {hero.label}
          {hero.provisional ? <span className="ml-1 text-ink/40">·&nbsp;draft</span> : null}
        </p>
        <p
          className={`workspace-metric-hero-value ${heroResult.display === null ? "text-ink/35" : "text-ink"}`}
          data-workspace-number
        >
          {heroResult.display ?? "—"}
        </p>
        <p className="mt-3 text-xs leading-5 text-ink/55">{heroResult.basis}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {TILE_KEYS.map((key) => {
          const metric = operationsMetric(key);
          const result = metric.compute(requests, window);
          return (
            <Tile
              key={key}
              label={metric.label}
              value={result.display}
              basis={result.basis}
              provisional={metric.provisional}
            />
          );
        })}
      </div>
    </section>
  );
}
