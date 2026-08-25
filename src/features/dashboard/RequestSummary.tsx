import type { ReactNode } from "react";
import type { RequestRow } from "@/services/dashboard";
import { Stat, titleCase } from "@/features/dashboard/ui";
import { REQUEST_KIND_PLURAL, REQUEST_KINDS, requestKind } from "@/features/requests/presentation";

// Lifecycle states always shown, so the strip keeps a stable shape as work moves
// through it. The rest appear only once something is actually in them.
const CORE_STATUSES = ["open", "assigned", "in_progress", "completed"] as const;
const OTHER_STATUSES = ["new", "awaiting_assignment", "cancelled"] as const;

export interface RequestSummaryCounts {
  total: number;
  byKind: { key: string; label: string; value: number }[];
  byStatus: { key: string; label: string; value: number }[];
}

export function summariseRequests(rows: RequestRow[]): RequestSummaryCounts {
  const countOf = (predicate: (row: RequestRow) => boolean) => rows.filter(predicate).length;

  const statusKeys = [
    ...CORE_STATUSES,
    ...OTHER_STATUSES.filter((status) => rows.some((row) => row.status === status)),
  ];

  return {
    total: rows.length,
    // All four kinds always render: they fill the grid exactly and the strip
    // keeps its shape whether or not a workspace holds sales orders.
    byKind: REQUEST_KINDS.map((kind) => ({
      key: kind,
      label: REQUEST_KIND_PLURAL[kind],
      value: countOf((row) => requestKind(row) === kind),
    })),
    byStatus: statusKeys.map((status) => ({
      key: status,
      label: titleCase(status),
      value: countOf((row) => row.status === status),
    })),
  };
}

// Columns are 2 or 4, never 3, so padding the row to a multiple of four leaves a
// clean rectangle at both breakpoints — a ragged last row would leave the strip
// with an open right and bottom edge.
const COLUMNS = 4;

function StatStrip({ label, count, children }: { label: string; count: number; children: ReactNode }) {
  const fillers = (COLUMNS - (count % COLUMNS)) % COLUMNS;

  return (
    <div>
      <h3 className="mb-2 font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-ink/55">
        {label}
      </h3>
      <div className="workspace-metric-band grid grid-cols-2 lg:grid-cols-4">
        {children}
        {Array.from({ length: fillers }, (_, index) => (
          <div
            key={`filler-${index}`}
            aria-hidden="true"
            className="workspace-metric-cell border-b border-r bg-cobalt-wash/25"
          />
        ))}
      </div>
    </div>
  );
}

export function RequestSummary({ rows }: { rows: RequestRow[] }) {
  const summary = summariseRequests(rows);
  if (summary.total === 0) return null;

  return (
    <section aria-label="Service request summary" className="space-y-5">
      <StatStrip label="By type" count={summary.byKind.length}>
        {summary.byKind.map((entry) => (
          <Stat key={entry.key} label={entry.label} value={entry.value} />
        ))}
      </StatStrip>

      <StatStrip label="By status" count={summary.byStatus.length}>
        {summary.byStatus.map((entry) => (
          <Stat
            key={entry.key}
            label={entry.label}
            value={entry.value}
            // Open work is what needs attention, so it carries the accent.
            tone={entry.key === "open" && entry.value > 0 ? "amber" : undefined}
          />
        ))}
      </StatStrip>
    </section>
  );
}
