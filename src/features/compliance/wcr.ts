import { financeMetrics, type WeeklyFinancials } from "@/features/finance/ratios";

// The Weighted Compliance Ratio: how much of the weight staff assigned to the
// finance metrics a client is currently carrying.
//
// Each metric passes or fails against a threshold staff set, and the ratio is
// the share of total weight that passed. A metric with no figures behind it
// does not count as a failure — it counts as nothing, and drops out of both
// sides of the division. Scoring an unreported metric as zero would let a
// client's ratio fall because their partner had not filed yet.
//
// Three windows, as the brief asks: the latest week, the quarter to date, and
// the year to date. They are the same calculation over different weeks.

export interface MetricSetting {
  metric_key: string;
  label: string;
  weight: number;
  threshold: number;
  direction: "higher_is_better" | "lower_is_better";
  active: boolean;
}

export interface MetricOutcome {
  key: string;
  label: string;
  weight: number;
  threshold: number;
  direction: MetricSetting["direction"];
  /** Null when the figures behind the metric have not been filed. */
  value: number | null;
  /** Null when there is nothing to judge. */
  achieved: boolean | null;
}

export interface ComplianceWindow {
  /** 0–100, or null when no metric could be scored at all. */
  ratio: number | null;
  outcomes: MetricOutcome[];
  weightScored: number;
  weightTotal: number;
}

export interface ComplianceResult {
  current: ComplianceWindow;
  quarterToDate: ComplianceWindow;
  yearToDate: ComplianceWindow;
}

function meetsThreshold(
  value: number,
  threshold: number,
  direction: MetricSetting["direction"],
): boolean {
  return direction === "higher_is_better" ? value >= threshold : value <= threshold;
}

function scoreWindow(weeks: WeeklyFinancials[], settings: MetricSetting[]): ComplianceWindow {
  const metrics = new Map(financeMetrics(weeks).map((metric) => [metric.key, metric]));

  const outcomes: MetricOutcome[] = settings
    .filter((setting) => setting.active)
    .map((setting) => {
      const value = metrics.get(setting.metric_key)?.value ?? null;
      return {
        key: setting.metric_key,
        label: setting.label,
        weight: Number(setting.weight),
        threshold: Number(setting.threshold),
        direction: setting.direction,
        value,
        achieved:
          value === null ? null : meetsThreshold(value, Number(setting.threshold), setting.direction),
      };
    });

  const scored = outcomes.filter((outcome) => outcome.achieved !== null);
  const weightScored = scored.reduce((total, outcome) => total + outcome.weight, 0);
  const weightPassed = scored
    .filter((outcome) => outcome.achieved === true)
    .reduce((total, outcome) => total + outcome.weight, 0);

  return {
    // Nothing scored is not zero compliance, it is no measurement.
    ratio: weightScored === 0 ? null : (weightPassed / weightScored) * 100,
    outcomes,
    weightScored,
    weightTotal: outcomes.reduce((total, outcome) => total + outcome.weight, 0),
  };
}

/**
 * Scores the three windows.
 *
 * `quarterWeeks` are the weeks filed for the quarter being reported; `yearWeeks`
 * every week filed for the fiscal year. Current reads the latest week alone,
 * which is what makes it move week to week while the other two smooth out.
 */
export function complianceRatio({
  quarterWeeks,
  yearWeeks,
  settings,
}: {
  quarterWeeks: WeeklyFinancials[];
  yearWeeks: WeeklyFinancials[];
  settings: MetricSetting[];
}): ComplianceResult {
  const latest = [...quarterWeeks].sort((left, right) => right.fiscal_week - left.fiscal_week)[0];

  return {
    current: scoreWindow(latest ? [latest] : [], settings),
    quarterToDate: scoreWindow(quarterWeeks, settings),
    yearToDate: scoreWindow(yearWeeks, settings),
  };
}

/** True when a window has been measured and is short of full compliance. */
export function isNonCompliant(window: ComplianceWindow): boolean {
  return window.ratio !== null && window.ratio < 100;
}
