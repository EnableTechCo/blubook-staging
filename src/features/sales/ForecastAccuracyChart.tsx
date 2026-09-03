import type { ForecastAccuracyPoint } from "@/features/sales/forecastAccuracy";

const WIDTH = 720;
const HEIGHT = 230;
const PADDING = { top: 16, right: 16, bottom: 34, left: 42 };
const plotWidth = WIDTH - PADDING.left - PADDING.right;
const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

export function ForecastAccuracyChart({ points }: { points: ForecastAccuracyPoint[] }) {
  const ceiling = Math.max(...points.flatMap((point) => [point.forecasted, point.actual]), 1);
  const x = (week: number) => PADDING.left + ((week - 1) / (points.length - 1)) * plotWidth;
  const y = (value: number) => PADDING.top + plotHeight - (value / ceiling) * plotHeight;
  const line = (key: "forecasted" | "actual") => points.map((point) => `${x(point.week)},${y(point[key])}`).join(" ");

  return (
    <figure className="border border-ink bg-paper">
      <figcaption className="border-b border-ink px-5 py-4">
        <h3 className="font-heading text-[1.35rem] leading-none text-ink">Forecast vs actual booking timeline</h3>
        <p className="mt-2 text-xs leading-5 text-ink/55">Cumulative bookings by the week forecast, compared with the week the booking actually landed.</p>
      </figcaption>
      <div className="overflow-x-auto p-4">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full min-w-[36rem]" role="img" aria-label="Cumulative forecasted and actual bookings by fiscal week.">
          {[0, 0.5, 1].map((fraction) => {
            const value = Math.round(ceiling * fraction);
            return <g key={fraction}><line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y(value)} y2={y(value)} className="stroke-ink/12" /><text x={PADDING.left - 8} y={y(value) + 4} textAnchor="end" className="fill-ink/45 font-mono text-[10px]">{value}</text></g>;
          })}
          {points.map((point) => <text key={point.week} x={x(point.week)} y={HEIGHT - 12} textAnchor="middle" className="fill-ink/45 font-mono text-[10px]">{point.week}</text>)}
          <polyline points={line("forecasted")} fill="none" className="stroke-ink" strokeWidth={2} strokeDasharray="7 5" />
          <polyline points={line("actual")} fill="none" className="stroke-cobalt" strokeWidth={2.5} />
          {points.map((point) => <circle key={point.week} cx={x(point.week)} cy={y(point.actual)} r={3} className="fill-cobalt" />)}
        </svg>
      </div>
      <div className="flex flex-wrap gap-6 border-t border-ink px-5 py-3">
        <span className="flex items-center gap-2 text-[11px] text-ink/60"><span className="inline-block h-0 w-6 border-t-2 border-dashed border-ink" />Forecast week</span>
        <span className="flex items-center gap-2 text-[11px] text-ink/60"><span className="inline-block h-0 w-6 border-t-[3px] border-cobalt" />Actual booking week</span>
      </div>
    </figure>
  );
}
