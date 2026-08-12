import { FISCAL_WEEKS_PER_QUARTER } from "@/lib/time";
import { phaseTargetAcrossQuarter } from "@/lib/validation/salesTargets";

// Everything the dashboards plot comes from the sales pipeline, and the brief
// is explicit that the definitions will move. So there is one chart shape here
// — cumulative actual against a phased target, thirteen weeks wide — and a
// registry of measures that decide which opportunities count toward it.
//
// Adding "Total Transactional Phasing" or a product split later is a new entry
// in MEASURES, not a new chart. The workbook ships five charts that all read
// the same range, which is a strong hint that they are one shape repeated.

export interface PhasingOpportunity {
  revenue: number;
  forecast_category: string;
  fiscal_year: number | null;
  fiscal_quarter: number | null;
  fiscal_week: number | null;
}

export interface PhasingMeasure {
  key: string;
  label: string;
  /** Shown under the chart, so the reader knows what the line counts. */
  description: string;
  includes: (opportunity: PhasingOpportunity) => boolean;
}

// 'booked' is shipped and invoiced; 'closed' is money in the bank. Anything
// closed has necessarily been booked, so both count as delivered revenue —
// counting only 'booked' would make a quarter's actuals fall as deals were paid.
const DELIVERED = new Set(["booked", "closed"]);

// Categories a deal passes through while still in play.
const IN_PLAY = new Set(["open", "upside", "best_case", "commit"]);

export const MEASURES: PhasingMeasure[] = [
  {
    key: "booked",
    label: "Total Cumulative Booked vs Target",
    description: "Revenue from opportunities that reached Booked or Closed.",
    includes: (opportunity) => DELIVERED.has(opportunity.forecast_category),
  },
  {
    key: "weighted",
    label: "Cumulative Pipeline vs Target",
    description:
      "Every opportunity in the quarter, delivered or still in play, so the target is read against the whole book.",
    includes: (opportunity) =>
      DELIVERED.has(opportunity.forecast_category) || IN_PLAY.has(opportunity.forecast_category),
  },
];

export function measureByKey(key: string): PhasingMeasure {
  return MEASURES.find((measure) => measure.key === key) ?? MEASURES[0]!;
}

export interface PhasingPoint {
  week: number;
  /** Cumulative target for the week. Always present: it is phased, not observed. */
  target: number;
  /**
   * Cumulative actual, or null for weeks the quarter has not reached yet.
   * Null rather than zero so the line stops instead of diving to the axis —
   * the workbook's own Actual series simply ends at the current week.
   */
  actual: number | null;
}

export interface PhasingSeries {
  points: PhasingPoint[];
  /** Cumulative actual at the last elapsed week. */
  actualToDate: number;
  target: number;
  /** Null when no target is set: no target and a target of zero differ. */
  hasTarget: boolean;
}

/**
 * Buckets opportunities into the thirteen weeks of one quarter and accumulates
 * them, against an evenly phased target.
 *
 * `throughWeek` is how far the quarter has progressed. Weeks beyond it get a
 * null actual, which is what makes a mid-quarter chart show a target line
 * running ahead of an actual line that has not happened yet.
 *
 * An opportunity with no fiscal week is counted from week one: the client has
 * said which quarter it belongs to but not when, and dropping it would make
 * the totals disagree with the pipeline table.
 */
export function buildPhasingSeries({
  opportunities,
  measure,
  fiscalYear,
  fiscalQuarter,
  throughWeek,
  target,
  weeklyTargets = {},
}: {
  opportunities: PhasingOpportunity[];
  measure: PhasingMeasure;
  fiscalYear: number;
  fiscalQuarter: number;
  throughWeek: number;
  target: number | null;
  weeklyTargets?: Record<number, number>;
}): PhasingSeries {
  const weekly = new Array<number>(FISCAL_WEEKS_PER_QUARTER).fill(0);

  for (const opportunity of opportunities) {
    if (opportunity.fiscal_year !== fiscalYear) continue;
    if (opportunity.fiscal_quarter !== fiscalQuarter) continue;
    if (!measure.includes(opportunity)) continue;

    const week = opportunity.fiscal_week ?? 1;
    if (week < 1 || week > FISCAL_WEEKS_PER_QUARTER) continue;
    weekly[week - 1] += Number(opportunity.revenue) || 0;
  }

  const phasedTarget = phaseTargetAcrossQuarter(
    target ?? 0,
    FISCAL_WEEKS_PER_QUARTER,
    weeklyTargets,
  );

  let running = 0;
  let actualToDate = 0;
  const points = weekly.map((amount, index) => {
    running += amount;
    const week = index + 1;
    const elapsed = week <= throughWeek;
    if (elapsed) actualToDate = running;
    return { week, target: phasedTarget[index]!, actual: elapsed ? running : null };
  });

  return { points, actualToDate, target: target ?? 0, hasTarget: target !== null };
}

// ---------------------------------------------------------------------------
// The Sales Dashboard tiles
// ---------------------------------------------------------------------------

export interface SalesDashSummary {
  /** Cumulative delivered revenue for the quarter so far. */
  quarterToDate: number;
  quarterTarget: number;
  hasTarget: boolean;
  /** Still in play, by forecast category, for the quarter. */
  commit: number;
  bestCase: number;
  upside: number;
  /**
   * Revenue still in play whose expected week has already passed. The deck
   * calls this Slipped: the week it was due has gone by and it has not landed.
   */
  slipped: number;
}

export function summariseQuarter({
  opportunities,
  fiscalYear,
  fiscalQuarter,
  throughWeek,
  target,
}: {
  opportunities: PhasingOpportunity[];
  fiscalYear: number;
  fiscalQuarter: number;
  throughWeek: number;
  target: number | null;
}): SalesDashSummary {
  const summary: SalesDashSummary = {
    quarterToDate: 0,
    quarterTarget: target ?? 0,
    hasTarget: target !== null,
    commit: 0,
    bestCase: 0,
    upside: 0,
    slipped: 0,
  };

  for (const opportunity of opportunities) {
    if (opportunity.fiscal_year !== fiscalYear) continue;
    if (opportunity.fiscal_quarter !== fiscalQuarter) continue;

    const revenue = Number(opportunity.revenue) || 0;
    const week = opportunity.fiscal_week ?? 1;
    const category = opportunity.forecast_category;

    if (DELIVERED.has(category)) {
      if (week <= throughWeek) summary.quarterToDate += revenue;
      continue;
    }

    if (category === "commit") summary.commit += revenue;
    if (category === "best_case") summary.bestCase += revenue;
    if (category === "upside") summary.upside += revenue;

    // Open deals count toward slipped as much as forecast ones do: what makes
    // a deal slipped is the week passing, not how confident anyone was.
    if (IN_PLAY.has(category) && week < throughWeek) summary.slipped += revenue;
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Metric definitions
// ---------------------------------------------------------------------------
//
// Forecast categories carry their own definitions in the database, seeded from
// the workbook, and the legend reads them from there so it cannot drift from
// what the Pipeline editor shows.
//
// These four are computed rather than stored, so they are defined here — once,
// for every surface that renders them. "Slipped" in particular is a judgement
// this codebase makes rather than something the brief spelled out, and stating
// it plainly is the only way a reader can tell whether they agree with it.
export const COMPUTED_METRIC_DEFINITIONS: { term: string; definition: string }[] = [
  {
    term: "QTD sales phasing",
    definition:
      "Revenue delivered so far this quarter — every opportunity that reached Booked or Closed in a week the quarter has already passed.",
  },
  {
    term: "QTR target",
    definition:
      "The revenue target you set for the quarter, on the Targets page. It is phased evenly across the thirteen weeks, so week one carries a thirteenth of it.",
  },
  {
    term: "Slipped",
    definition:
      "Revenue still in play whose expected week has already gone by. A deal slips because its week passed, not because of how confident anyone was, so Open deals count here alongside forecast ones — which means a deal can be both Slipped and Commit.",
  },
  {
    term: "Actual vs Target",
    definition:
      "The chart accumulates week by week. The target line runs the full quarter; the actual line stops at the current week, because later weeks have not happened yet.",
  },
];
