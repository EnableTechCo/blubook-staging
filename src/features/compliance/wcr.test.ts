import { describe, expect, it } from "vitest";
import { complianceRatio, isNonCompliant, type MetricSetting } from "@/features/compliance/wcr";
import type { WeeklyFinancials } from "@/features/finance/ratios";

const week = (overrides: Partial<WeeklyFinancials> = {}): WeeklyFinancials => ({
  fiscal_week: 1,
  net_income: 0,
  non_cash_expenses: 0,
  working_capital_change: 0,
  earnings: 0,
  taxes: 0,
  depreciation: 0,
  amortisation: 0,
  current_assets: 0,
  current_liabilities: 0,
  total_liabilities: 0,
  total_equity: 0,
  lost_customers: 0,
  total_customers: 0,
  ...overrides,
});

const setting = (overrides: Partial<MetricSetting> & Pick<MetricSetting, "metric_key">): MetricSetting => ({
  label: overrides.metric_key,
  weight: 1,
  threshold: 0,
  direction: "higher_is_better",
  active: true,
  ...overrides,
});

describe("scoring against thresholds", () => {
  it("passes a higher-is-better metric that clears its threshold", () => {
    const result = complianceRatio({
      quarterWeeks: [week({ current_assets: 200, current_liabilities: 100 })],
      yearWeeks: [],
      settings: [setting({ metric_key: "working_capital", threshold: 50 })],
    });
    expect(result.current.ratio).toBe(100);
  });

  it("fails a higher-is-better metric that falls short", () => {
    const result = complianceRatio({
      quarterWeeks: [week({ current_assets: 100, current_liabilities: 90 })],
      yearWeeks: [],
      settings: [setting({ metric_key: "working_capital", threshold: 50 })],
    });
    expect(result.current.ratio).toBe(0);
  });

  // Churn and debt-to-equity are better low, so the comparison inverts.
  it("passes a lower-is-better metric that stays under its threshold", () => {
    const result = complianceRatio({
      quarterWeeks: [week({ lost_customers: 1, total_customers: 100 })],
      yearWeeks: [],
      settings: [
        setting({ metric_key: "churn", threshold: 10, direction: "lower_is_better" }),
      ],
    });
    expect(result.current.ratio).toBe(100);
  });

  it("fails a lower-is-better metric that exceeds its threshold", () => {
    const result = complianceRatio({
      quarterWeeks: [week({ lost_customers: 40, total_customers: 100 })],
      yearWeeks: [],
      settings: [
        setting({ metric_key: "churn", threshold: 10, direction: "lower_is_better" }),
      ],
    });
    expect(result.current.ratio).toBe(0);
  });

  it("treats meeting the threshold exactly as achieved", () => {
    const result = complianceRatio({
      quarterWeeks: [week({ lost_customers: 10, total_customers: 100 })],
      yearWeeks: [],
      settings: [
        setting({ metric_key: "churn", threshold: 10, direction: "lower_is_better" }),
      ],
    });
    expect(result.current.ratio).toBe(100);
  });
});

describe("weighting", () => {
  const weeks = [
    week({
      // Working capital 100 — passes. Churn 50% — fails.
      current_assets: 200,
      current_liabilities: 100,
      lost_customers: 50,
      total_customers: 100,
    }),
  ];

  it("weights a passing metric above a failing one", () => {
    const result = complianceRatio({
      quarterWeeks: weeks,
      yearWeeks: weeks,
      settings: [
        setting({ metric_key: "working_capital", weight: 3, threshold: 50 }),
        setting({ metric_key: "churn", weight: 1, threshold: 10, direction: "lower_is_better" }),
      ],
    });
    // 3 of 4 units of weight passed.
    expect(result.current.ratio).toBe(75);
  });

  it("ignores a metric staff switched off", () => {
    const result = complianceRatio({
      quarterWeeks: weeks,
      yearWeeks: weeks,
      settings: [
        setting({ metric_key: "working_capital", threshold: 50 }),
        setting({
          metric_key: "churn",
          threshold: 10,
          direction: "lower_is_better",
          active: false,
        }),
      ],
    });
    expect(result.current.ratio).toBe(100);
    expect(result.current.outcomes).toHaveLength(1);
  });
});

// The distinction that keeps the ratio honest.
describe("metrics with nothing behind them", () => {
  it("drops an unmeasurable metric from both sides rather than failing it", () => {
    // No equity filed, so debt-to-equity cannot be worked out at all. Scoring
    // it zero would punish the client for their partner not having filed.
    const result = complianceRatio({
      quarterWeeks: [week({ current_assets: 200, current_liabilities: 100, total_equity: 0 })],
      yearWeeks: [],
      settings: [
        setting({ metric_key: "working_capital", threshold: 50 }),
        setting({ metric_key: "debt_to_equity", threshold: 100, direction: "lower_is_better" }),
      ],
    });
    expect(result.current.ratio).toBe(100);
    expect(result.current.weightScored).toBe(1);
    expect(result.current.weightTotal).toBe(2);
  });

  it("reports no ratio at all when nothing could be scored", () => {
    const result = complianceRatio({
      quarterWeeks: [],
      yearWeeks: [],
      settings: [setting({ metric_key: "working_capital" })],
    });
    expect(result.current.ratio).toBeNull();
    expect(isNonCompliant(result.current)).toBe(false);
  });
});

describe("the three windows", () => {
  const weeks = [
    week({ fiscal_week: 10, earnings: 100, current_assets: 10, current_liabilities: 100 }),
    week({ fiscal_week: 11, earnings: 100, current_assets: 500, current_liabilities: 100 }),
  ];
  const settings = [
    setting({ metric_key: "working_capital", threshold: 0 }),
    setting({ metric_key: "ebitda", threshold: 150 }),
  ];

  it("scores current on the latest week alone", () => {
    const result = complianceRatio({ quarterWeeks: weeks, yearWeeks: weeks, settings });
    // Week 11: working capital 400 passes; EBITDA for that week alone is 100,
    // short of 150, so half the weight passes.
    expect(result.current.ratio).toBe(50);
  });

  it("scores quarter to date across every week filed", () => {
    const result = complianceRatio({ quarterWeeks: weeks, yearWeeks: weeks, settings });
    // EBITDA sums to 200 across the quarter and now clears 150.
    expect(result.quarterToDate.ratio).toBe(100);
  });

  it("scores year to date over its own weeks", () => {
    const result = complianceRatio({ quarterWeeks: weeks, yearWeeks: [weeks[0]!], settings });
    // Only week 10 in the year: EBITDA 100 fails, working capital -90 fails.
    expect(result.yearToDate.ratio).toBe(0);
  });
});

describe("isNonCompliant", () => {
  it("is true for a measured window short of full compliance", () => {
    expect(isNonCompliant({ ratio: 60, outcomes: [], weightScored: 1, weightTotal: 1 })).toBe(true);
  });

  it("is false at full compliance", () => {
    expect(isNonCompliant({ ratio: 100, outcomes: [], weightScored: 1, weightTotal: 1 })).toBe(false);
  });

  it("is false when nothing was measured, so silence never raises an alarm", () => {
    expect(isNonCompliant({ ratio: null, outcomes: [], weightScored: 0, weightTotal: 1 })).toBe(false);
  });
});
