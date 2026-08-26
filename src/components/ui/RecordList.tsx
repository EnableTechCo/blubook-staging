import type { ReactNode } from "react";

/**
 * The list that replaced the wide tables.
 *
 * Every one of them declared a min-width larger than the page it sat in, so it
 * scrolled sideways on any normal screen and took the last column — which is
 * where the actions were — off the edge with it. A record could be read and not
 * acted on, because the control was not on screen.
 *
 * A table is still the right answer when the job is comparing many rows across
 * many fields; the requests grid remains one for exactly that reason. It is the
 * wrong answer for a handful of fields per record where the point is to read
 * one and act on it.
 *
 * The hairline grid keeps the table's visual language: a one pixel gap over an
 * ink background reads as a ruled list without any of the layout consequences.
 */
export function RecordList({ children }: { children: ReactNode }) {
  return <div className="workspace-record-list">{children}</div>;
}

export function Record({ children }: { children: ReactNode }) {
  return <article className="workspace-record workspace-record-row">{children}</article>;
}

/**
 * The header of a record: what it is on the left, what it is worth on the
 * right, wrapping rather than scrolling when there is no room for both.
 */
export function RecordHeader({ children }: { children: ReactNode }) {
  return (
    <div className="workspace-record-header flex flex-wrap items-start justify-between gap-x-6 gap-y-3">{children}</div>
  );
}

/** A labelled value. Several of these sit in a RecordMetaList. */
export function RecordMeta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-body text-[10px] font-semibold uppercase tracking-[0.06em] text-ink/55">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm text-ink/80">{children}</dd>
    </div>
  );
}

export function RecordMetaList({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}) {
  const grid = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <dl className={`workspace-record-meta-list mt-3 grid gap-0 border-t border-ink/8 ${grid}`}>{children}</dl>
  );
}

/** Row actions, kept in the flow of the record rather than in a last column. */
export function RecordActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/8 pt-3">
      {children}
    </div>
  );
}
