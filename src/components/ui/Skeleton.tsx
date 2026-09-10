import type { ReactNode } from "react";

/**
 * The bones a loading state is built from.
 *
 * A route's loading.tsx should look like the page it stands in for: same
 * width, same header, same frames in the same order, so the swap when the
 * data arrives is a fill-in rather than a re-layout. These pieces reuse the
 * real workspace classes — `workspace-page-header`, `workspace-panel`,
 * `workspace-metric-band` and the rest — so the frames are the page's own
 * frames, with grey where the words will be.
 *
 * Everything here is static markup: no data, no client code. The pulse is
 * `motion-safe`, so a reduced-motion user gets a still placeholder.
 */

type Tone = "line" | "title" | "field" | "block";

const TONE: Record<Tone, string> = {
  line: "bg-ink/[0.06]",
  title: "bg-ink/[0.1]",
  field: "border border-ink/10 bg-paper",
  block: "bg-ink/[0.04]",
};

/** One grey shape. Size it with height/width classes. */
export function Bone({ className = "", tone = "line" }: { className?: string; tone?: Tone }) {
  return <div aria-hidden="true" className={`rounded-sm ${TONE[tone]} ${className}`} />;
}

/** The page container: the same width and rhythm the real page uses. */
export function SkeletonPage({
  width,
  rhythm = "space-y-8",
  children,
}: {
  /** The page's own container classes, e.g. "max-w-5xl". */
  width: string;
  /** "space-y-8" for most pages, "space-y-7" for the operations pages, "" for pages that space with mt-*. */
  rhythm?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`mx-auto ${width} ${rhythm} motion-safe:animate-pulse`}
      aria-busy="true"
      aria-live="polite"
    >
      {children}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** A small "← Back" link line, for pages that carry one above the header. */
export function SkeletonBackLink() {
  return <Bone className="h-3 w-28" />;
}

/** WorkspaceHeader: eyebrow, title, description, and the optional aside. */
export function SkeletonHeader({
  eyebrow = true,
  description = true,
  titleWidth = "w-64",
  aside,
}: {
  eyebrow?: boolean;
  description?: boolean;
  titleWidth?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="workspace-page-header">
      <div>
        {eyebrow ? <Bone className="h-2.5 w-16" /> : null}
        <Bone tone="title" className={`${eyebrow ? "mt-4" : ""} h-8 ${titleWidth} max-w-full`} />
        {description ? <Bone className="mt-4 h-3.5 w-full max-w-[42rem]" /> : null}
      </div>
      {aside ? <div className="lg:pb-1">{aside}</div> : null}
    </header>
  );
}

/** A button-shaped bone, for header asides and action rows. */
export function SkeletonButton({ width = "w-32", className = "" }: { width?: string; className?: string }) {
  return <Bone tone="field" className={`h-10 ${width} rounded-md ${className}`} />;
}

/** Section: the workspace panel with its header strip and body. */
export function SkeletonPanel({
  subtitle = true,
  action = false,
  bodyClassName = "",
  children,
}: {
  subtitle?: boolean;
  action?: boolean;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className="workspace-panel">
      <div className="workspace-panel-header">
        <div>
          <Bone tone="title" className="h-5 w-40" />
          {subtitle ? <Bone className="mt-2.5 h-3 w-72 max-w-full" /> : null}
        </div>
        {action ? <SkeletonButton width="w-28" /> : null}
      </div>
      <div className={`workspace-panel-body ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/** The plain bordered frame several forms use: `border border-ink bg-paper-light px-5 py-5`. */
export function SkeletonFrame({
  heading = true,
  intro = true,
  className = "",
  children,
}: {
  heading?: boolean;
  intro?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`border border-ink bg-paper-light px-5 py-5 ${className}`}>
      {heading ? <Bone tone="title" className="h-6 w-44" /> : null}
      {intro ? <Bone className="mt-3 h-3 w-full max-w-2xl" /> : null}
      {children}
    </section>
  );
}

/** The metric band: value over label, one cell per stat. */
export function SkeletonMetricBand({
  count,
  cols,
  cell = "p-5",
}: {
  count: number;
  /** The band's own grid columns, e.g. "sm:grid-cols-2 xl:grid-cols-4". */
  cols: string;
  cell?: string;
}) {
  return (
    <section className={`workspace-metric-band grid ${cols}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={`workspace-metric-cell border-b border-r ${cell}`}>
          <Bone tone="title" className="h-8 w-16" />
          <Bone className="mt-3 h-2.5 w-24" />
        </div>
      ))}
    </section>
  );
}

/** The metric hero + tile grid used by the dashboard cards. */
export function SkeletonMetricCard({ tiles, cols }: { tiles: number; cols: string }) {
  return (
    <section className="workspace-panel">
      <div className="workspace-panel-header">
        <div>
          <Bone tone="title" className="h-5 w-44" />
          <Bone className="mt-2.5 h-3 w-64" />
        </div>
      </div>
      <div className="workspace-metric-hero">
        <Bone className="h-2.5 w-24" />
        <Bone tone="title" className="mt-3 h-11 w-40" />
      </div>
      <div className={`grid ${cols}`} aria-hidden="true">
        {Array.from({ length: tiles }, (_, index) => (
          <div key={index} className="workspace-metric-cell border-b border-r p-5">
            <Bone tone="title" className="h-7 w-14" />
            <Bone className="mt-3 h-2.5 w-20" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** The card landings: a grid of workspace action cards. */
export function SkeletonActionCards({ count, cols }: { count: number; cols: string }) {
  return (
    <ul className={`grid gap-4 ${cols}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="workspace-action-card flex min-h-64 flex-col p-5 sm:p-6">
          <Bone className="h-2.5 w-6" />
          <Bone tone="title" className="mt-5 h-6 w-3/4" />
          <div className="mt-3 space-y-2">
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-5/6" />
          </div>
          <div className="mt-auto pt-7">
            <div className="border-t border-ink/9 pt-3">
              <Bone className="h-2 w-2/3" />
            </div>
            <Bone className="mt-4 h-3 w-12" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** One labelled form control. `tall` for a textarea. */
export function SkeletonField({
  tall = false,
  help = false,
  className = "",
}: {
  tall?: boolean;
  help?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <Bone className="h-3 w-24" />
      <Bone tone="field" className={`mt-2 w-full ${tall ? "h-28" : "h-10"}`} />
      {help ? <Bone className="mt-2 h-2.5 w-2/3" /> : null}
    </div>
  );
}

/** A grid of fields, e.g. cols="sm:grid-cols-2". */
export function SkeletonFields({
  count,
  cols,
  gap = "gap-4",
  className = "",
}: {
  count: number;
  cols: string;
  gap?: string;
  className?: string;
}) {
  return (
    <div className={`grid ${gap} ${cols} ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonField key={index} />
      ))}
    </div>
  );
}

/** The submit row: a primary button and, optionally, a quiet link beside it. */
export function SkeletonSubmitRow({
  align = "start",
  secondary = true,
  className = "",
}: {
  align?: "start" | "end";
  secondary?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-4 ${align === "end" ? "justify-end" : ""} ${className}`}
    >
      <Bone tone="title" className="h-10 w-36 rounded-md" />
      {secondary ? <Bone className="h-3 w-14" /> : null}
    </div>
  );
}

/** A table in the workspace frame. */
export function SkeletonTable({
  rows,
  cols,
  minWidth = "",
}: {
  rows: number;
  cols: number;
  /** e.g. "min-w-[72rem]" for the wide request tables, which scroll. */
  minWidth?: string;
}) {
  return (
    <div className="workspace-table-frame overflow-x-auto" aria-hidden="true">
      <table className={`w-full ${minWidth}`}>
        <thead>
          <tr className="border-b border-ink/8 bg-cream/70">
            {Array.from({ length: cols }, (_, index) => (
              <th key={index} className="px-4 py-3 text-left">
                <Bone className="h-2 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row} className="border-b border-ink/8 last:border-b-0">
              {Array.from({ length: cols }, (_, col) => (
                <td key={col} className="px-4 py-4">
                  <Bone className={`h-3 ${col === 0 ? "w-32" : "w-20"}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The record list: bordered articles with a header row and a meta grid. */
export function SkeletonRecords({
  count,
  metas,
  metaCols = "sm:grid-cols-2 lg:grid-cols-3",
  amount = false,
  actions = false,
}: {
  count: number;
  metas: number;
  metaCols?: string;
  /** A figure on the right of the header, as the sales records show. */
  amount?: boolean;
  actions?: boolean;
}) {
  return (
    <div className="grid gap-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className="workspace-record px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div>
              <Bone tone="title" className="h-5 w-48" />
              <Bone className="mt-2 h-3 w-32" />
            </div>
            {amount ? <Bone tone="title" className="h-7 w-24" /> : <Bone tone="field" className="h-6 w-20 rounded-full" />}
          </div>
          {metas > 0 ? (
            <dl className={`mt-4 grid gap-4 border-t border-ink/8 pt-3 ${metaCols}`}>
              {Array.from({ length: metas }, (_, meta) => (
                <div key={meta}>
                  <Bone className="h-2 w-16" />
                  <Bone className="mt-2 h-3.5 w-28" />
                </div>
              ))}
            </dl>
          ) : null}
          {actions ? (
            <div className="mt-4 flex gap-3 border-t border-ink/8 pt-3">
              <SkeletonButton width="w-24" />
              <SkeletonButton width="w-20" />
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

/** Divided list rows: a title and meta on the left, a pill on the right. */
export function SkeletonRows({
  count,
  className = "divide-y divide-ink/8",
  row = "px-4 py-4",
  pill = true,
}: {
  count: number;
  className?: string;
  row?: string;
  pill?: boolean;
}) {
  return (
    <ul className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className={`flex items-center justify-between gap-4 ${row}`}>
          <div className="min-w-0 flex-1">
            <Bone tone="title" className="h-4 w-56 max-w-full" />
            <Bone className="mt-2 h-3 w-40 max-w-full" />
          </div>
          {pill ? <Bone tone="field" className="h-6 w-20 shrink-0 rounded-full" /> : null}
        </li>
      ))}
    </ul>
  );
}

/** The workspace data grid: bordered cells, one per row or per column. */
export function SkeletonDataGrid({
  count,
  cols = "",
  cell = "px-5 py-4",
}: {
  count: number;
  cols?: string;
  cell?: string;
}) {
  return (
    <ul className={`workspace-data-grid grid ${cols}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className={`workspace-data-cell ${cell}`}>
          <Bone className="h-2 w-20" />
          <Bone tone="title" className="mt-2 h-4 w-36 max-w-full" />
        </li>
      ))}
    </ul>
  );
}

/** The rounded surface card several lists sit in. */
export function SkeletonSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/75 shadow-surface ${className}`}>
      {children}
    </div>
  );
}
