import type { PhasingSeries } from "@/features/sales/phasing";
import { SAST_LOCALE } from "@/lib/time";

const compact = new Intl.NumberFormat(SAST_LOCALE, {
  style: "currency",
  currency: "ZAR",
  notation: "compact",
  maximumFractionDigits: 1,
});

// Drawn as inline SVG rather than pulled from a charting library: it is two
// lines on a fixed thirteen-column grid, and a dependency would cost more than
// it saves. viewBox units are arbitrary; the element scales to its container.
const WIDTH = 720;
const HEIGHT = 260;
const PADDING = { top: 16, right: 16, bottom: 34, left: 62 };

const plotWidth = WIDTH - PADDING.left - PADDING.right;
const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

export function PhasingChart({
  series,
  title,
  description,
}: {
  series: PhasingSeries;
  title: string;
  description: string;
}) {
  const values = series.points.flatMap((point) =>
    point.actual === null ? [point.target] : [point.target, point.actual],
  );
  // A flat zero chart would divide by zero below, so the axis never tops at 0.
  const ceiling = Math.max(...values, 1);

  const x = (week: number) =>
    PADDING.left + ((week - 1) / (series.points.length - 1)) * plotWidth;
  const y = (value: number) => PADDING.top + plotHeight - (value / ceiling) * plotHeight;

  const line = (pick: (point: PhasingSeries["points"][number]) => number | null) =>
    series.points
      .map((point) => {
        const value = pick(point);
        return value === null ? null : `${x(point.week)},${y(value)}`;
      })
      .filter((coordinate): coordinate is string => coordinate !== null)
      .join(" ");

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((fraction) => fraction * ceiling);

  return (
    <figure className="border border-ink bg-paper">
      <figcaption className="border-b border-ink px-5 py-4">
        <h3 className="font-heading text-[1.35rem] leading-none text-ink">{title}</h3>
        <p className="mt-2 text-xs leading-5 text-ink/55">{description}</p>
      </figcaption>

      <div className="overflow-x-auto p-4">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full min-w-[36rem]"
          role="img"
          aria-label={`${title}. Target ${compact.format(series.target)}, actual to date ${compact.format(series.actualToDate)}.`}
        >
          {gridValues.map((value) => (
            <g key={value}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y(value)}
                y2={y(value)}
                className="stroke-ink/12"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={y(value) + 4}
                textAnchor="end"
                className="fill-ink/45 font-mono text-[10px]"
              >
                {compact.format(value)}
              </text>
            </g>
          ))}

          {series.points.map((point) => (
            <text
              key={point.week}
              x={x(point.week)}
              y={HEIGHT - 12}
              textAnchor="middle"
              className="fill-ink/45 font-mono text-[10px]"
            >
              {point.week}
            </text>
          ))}

          {/* Target first, so the actual line reads on top of it.
              Every colour in this palette is a blue, so the two series are
              separated by value and by line style rather than by hue: the
              target is full-strength ink and dashed, the actual is cobalt and
              solid. At 35% opacity the target was barely visible against the
              grid. */}
          <polyline
            points={line((point) => point.target)}
            fill="none"
            className="stroke-ink"
            strokeWidth={2}
            strokeDasharray="7 5"
          />
          <polyline
            points={line((point) => point.actual)}
            fill="none"
            className="stroke-cobalt"
            strokeWidth={2.5}
          />
          {series.points
            .filter((point) => point.actual !== null)
            .map((point) => (
              <circle
                key={point.week}
                cx={x(point.week)}
                cy={y(point.actual!)}
                r={3}
                className="fill-cobalt"
              />
            ))}
        </svg>
      </div>

      <div className="flex flex-wrap gap-6 border-t border-ink px-5 py-3">
        <span className="flex items-center gap-2 text-[11px] text-ink/60">
          <span className="inline-block h-0 w-6 border-t-2 border-dashed border-ink" />
          Target {series.hasTarget ? compact.format(series.target) : "not set"}
        </span>
        <span className="flex items-center gap-2 text-[11px] text-ink/60">
          <span className="inline-block h-0 w-6 border-t-[3px] border-cobalt" />
          Actual {compact.format(series.actualToDate)}
        </span>
      </div>
    </figure>
  );
}
