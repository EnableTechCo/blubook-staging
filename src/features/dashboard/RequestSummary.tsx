import type { ReactNode } from "react";
import type { RequestRow } from "@/services/dashboard";
import { Stat, titleCase } from "@/features/dashboard/ui";

// Lifecycle states always shown, so the strip keeps a stable shape as work moves
// through it. The rest appear only once something is actually in them.
const CORE_STATUSES = ["open", "assigned", "in_progress", "completed"] as const;
const OTHER_STATUSES = ["new", "awaiting_assignment", "cancelled"] as const;

const TRANSACTION_LABELS: Record<string, string> = {
  general: "Service requests",
  purchase_order: "Purchase orders",
  tender_submission: "Tenders",
};

export interface RequestSummaryCounts {
  total: number;
  system: number;
  direct: number;
  byStatus: { key: string; label: string; value: number }[];
  byTransaction: { key: string; label: string; value: number }[];
}

export function summariseRequests(rows: RequestRow[]): RequestSummaryCounts {
  const countOf = (predicate: (row: RequestRow) => boolean) => rows.filter(predicate).length;

  const statusKeys = [
    ...CORE_STATUSES,
    ...OTHER_STATUSES.filter((status) => rows.some((row) => row.status === status)),
  ];

  // Only worth splitting out when the workspace holds more than plain requests.
  const transactionKeys = Object.keys(TRANSACTION_LABELS).filter((type) =>
    rows.some((row) => (row.request_type ?? "general") === type),
  );
  const hasNonGeneral = transactionKeys.some((type) => type !== "general");

  return {
    total: rows.length,
    system: countOf((row) => row.origin === "system"),
    direct: countOf((row) => row.origin !== "system"),
    byStatus: statusKeys.map((status) => ({
      key: status,
      label: titleCase(status),
      value: countOf((row) => row.status === status),
    })),
    byTransaction: hasNonGeneral
      ? transactionKeys.map((type) => ({
          key: type,
          label: TRANSACTION_LABELS[type] ?? titleCase(type),
          value: countOf((row) => (row.request_type ?? "general") === type),
        }))
      : [],
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
      <div className="grid grid-cols-2 border-l border-t border-ink lg:grid-cols-4">
        {children}
        {Array.from({ length: fillers }, (_, index) => (
          <div
            key={`filler-${index}`}
            aria-hidden="true"
            className="min-h-28 border-b border-r border-ink bg-cream/45"
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
      <StatStrip label="By type" count={3}>
        <Stat label="Total requests" value={summary.total} />
        <Stat label="System" value={summary.system} />
        <Stat label="Direct" value={summary.direct} />
      </StatStrip>

      {summary.byTransaction.length > 0 ? (
        <StatStrip label="By transaction" count={summary.byTransaction.length}>
          {summary.byTransaction.map((entry) => (
            <Stat key={entry.key} label={entry.label} value={entry.value} />
          ))}
        </StatStrip>
      ) : null}

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
