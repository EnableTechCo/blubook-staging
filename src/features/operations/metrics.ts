import type { RequestRow } from "@/services/dashboard";
import { fiscalWeekRange, sastFiscalPeriod } from "@/lib/time";

// The Operations Dashboard is deliberately indicative: a read on how a client's
// business is performing on BluBook, not an accounting of it. The brief left
// four of its five figures unnamed, so this is a registry rather than a fixed
// layout — renaming a metric, redefining it, or swapping which four appear is
// an edit here and nowhere else.
//
// Every metric below is computed from data the platform already records. None
// is invented to fill a slot: where a week holds nothing to measure, the tile
// says so instead of showing a confident zero.

export interface OperationsMetricResult {
  /** Formatted for display, or null when the week has nothing to measure. */
  display: string | null;
  /** What the figure was drawn from, shown under the tile. */
  basis: string;
}

export interface OperationsMetric {
  key: string;
  label: string;
  definition: string;
  /**
   * True while the brief has not confirmed this metric's name. The dashboard
   * marks these, so nobody mistakes a placeholder for a signed-off definition.
   */
  provisional: boolean;
  compute: (requests: RequestRow[], window: WeekWindow) => OperationsMetricResult;
}

export interface WeekWindow {
  start: Date;
  end: Date;
  week: number;
  quarterWeek: number;
  year: number;
  quarter: number;
}

export function currentWeekWindow(now: Date = new Date()): WeekWindow {
  const period = sastFiscalPeriod(now);
  const { start, end } = fiscalWeekRange(period.year, period.week);
  return {
    start,
    end,
    week: period.week,
    quarterWeek: period.quarterWeek,
    year: period.year,
    quarter: period.quarter,
  };
}

function within(value: string | null | undefined, window: WeekWindow): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return time >= window.start.getTime() && time < window.end.getTime();
}

function percentage(part: number, whole: number, basis: string): OperationsMetricResult {
  // A percentage of nothing is not zero, it is unknown. Showing 0% here would
  // read as failure when it actually means the week had no such work.
  if (whole === 0) return { display: null, basis: "No qualifying requests this week" };
  return { display: `${Math.round((part / whole) * 100)}%`, basis };
}

const OPEN_STATUSES = new Set([
  "new",
  "awaiting_assignment",
  "open",
  "assigned",
  "in_progress",
]);

function completedInWeek(requests: RequestRow[], window: WeekWindow): RequestRow[] {
  return requests.filter(
    (request) => request.status === "completed" && within(request.completed_at, window),
  );
}

/**
 * A request that reached completion without being handed back.
 *
 * Two things count as a hand-back: a partner rejecting the offer, so it had to
 * be routed again, and the status moving backwards at any point. Neither is
 * visible from the final status alone, which is why this reads the assignment
 * and event history rather than just `status`.
 */
function completedFirstTime(request: RequestRow): boolean {
  const rejected = (request.request_assignments ?? []).some(
    (assignment) => assignment.status === "rejected",
  );
  if (rejected) return false;

  const order = [
    "new",
    "awaiting_assignment",
    "open",
    "assigned",
    "in_progress",
    "completed",
  ];
  const events = request.request_events ?? [];
  let highest = -1;
  for (const event of [...events].sort(
    (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
  )) {
    const rank = order.indexOf(event.to_status);
    if (rank === -1) continue;
    if (rank < highest) return false;
    highest = rank;
  }
  return true;
}

export const OPERATIONS_METRICS: OperationsMetric[] = [
  {
    key: "ftc",
    label: "FTC performance",
    definition:
      "First Time Completion: of the requests completed this week, the share that finished without being handed back — no partner rejected the offer and the status never moved backwards.",
    // The brief was explicit that FTC was uncertain, so this reading is a
    // proposal until confirmed.
    provisional: true,
    compute: (requests, window) => {
      const completed = completedInWeek(requests, window);
      const clean = completed.filter(completedFirstTime);
      return percentage(clean.length, completed.length, `${clean.length} of ${completed.length} completed cleanly`);
    },
  },
  {
    key: "open",
    label: "Total open SR",
    definition:
      "Every request not yet completed or cancelled, whatever week it was raised in. A running total rather than a weekly figure.",
    provisional: false,
    compute: (requests) => {
      const open = requests.filter((request) => OPEN_STATUSES.has(request.status));
      return { display: String(open.length), basis: "Open right now, across all weeks" };
    },
  },
  {
    key: "on_time",
    label: "Completed on time",
    definition:
      "Of the requests completed this week that carried a due date, the share finished on or before it.",
    provisional: true,
    compute: (requests, window) => {
      const withDue = completedInWeek(requests, window).filter(
        (request) => request.request_schedules?.due_at,
      );
      const onTime = withDue.filter(
        (request) =>
          new Date(request.completed_at!).getTime() <=
          new Date(request.request_schedules!.due_at!).getTime(),
      );
      return percentage(onTime.length, withDue.length, `${onTime.length} of ${withDue.length} met their due date`);
    },
  },
  {
    key: "accepted_first_offer",
    label: "Accepted first time",
    definition:
      "Of the requests routed this week, the share a partner accepted without any offer being rejected first.",
    provisional: true,
    compute: (requests, window) => {
      const routed = requests.filter(
        (request) =>
          within(request.created_at, window) && (request.request_assignments ?? []).length > 0,
      );
      const clean = routed.filter(
        (request) =>
          !(request.request_assignments ?? []).some((assignment) => assignment.status === "rejected"),
      );
      return percentage(clean.length, routed.length, `${clean.length} of ${routed.length} routed without a rejection`);
    },
  },
  {
    key: "overdue",
    label: "Open and overdue",
    definition:
      "Of the requests still open that carry a due date, the share whose due date has already passed. Open requests with no due date are outside this figure and are counted separately beneath it.",
    provisional: true,
    compute: (requests) => {
      const now = Date.now();
      const allOpen = requests.filter((request) => OPEN_STATUSES.has(request.status));
      const dated = allOpen.filter((request) => request.request_schedules?.due_at);
      const overdue = dated.filter(
        (request) => new Date(request.request_schedules!.due_at!).getTime() < now,
      );
      // Naming the undated remainder matters: without it a tile reading 100%
      // sits beside "Total open SR 15" and looks like every request is late,
      // when the percentage only ever spoke about the dated few.
      const undated = allOpen.length - dated.length;
      const basis =
        undated > 0
          ? `${overdue.length} of ${dated.length} dated · ${undated} open with no due date`
          : `${overdue.length} of ${dated.length} open requests are past due`;
      return percentage(overdue.length, dated.length, basis);
    },
  },
];

export function operationsMetric(key: string): OperationsMetric {
  return OPERATIONS_METRICS.find((metric) => metric.key === key) ?? OPERATIONS_METRICS[0]!;
}
