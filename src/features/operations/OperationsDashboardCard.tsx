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
    <div className="border-b border-r border-ink bg-paper-light/70 p-4">
      <p className={`font-heading text-2xl leading-none ${value === null ? "text-ink/35" : "text-ink"}`}>
        {value ?? "—"}
      </p>
      <p className="mt-3 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
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
    <section className="border-t border-ink bg-paper">
      <div className="border-b border-ink px-5 py-5 sm:px-6">
        <h2 className="font-heading text-[1.65rem] font-normal leading-none tracking-[-0.02em] text-ink">
          Operations Dashboard
        </h2>
        <p className="mt-2 text-xs leading-5 text-ink/55">
          Q{window.quarter} · week {window.quarterWeek} of 13 · how your work is moving through
          BluBook
        </p>
      </div>

      <div className="border-b border-ink bg-cream/40 px-5 py-6 sm:px-6">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
          {hero.label}
          {hero.provisional ? <span className="ml-1 text-ink/40">·&nbsp;draft</span> : null}
        </p>
        <p
          className={`mt-3 font-heading text-5xl leading-none ${heroResult.display === null ? "text-ink/35" : "text-ink"}`}
        >
          {heroResult.display ?? "—"}
        </p>
        <p className="mt-3 text-xs leading-5 text-ink/55">{heroResult.basis}</p>
      </div>

      <div className="grid grid-cols-1 border-l border-ink sm:grid-cols-2 lg:grid-cols-4">
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
