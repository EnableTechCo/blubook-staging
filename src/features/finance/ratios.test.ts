import { describe, expect, it } from "vitest";
import { financeMetrics, type WeeklyFinancials } from "@/features/finance/ratios";

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

const metric = (weeks: WeeklyFinancials[], key: string) =>
  financeMetrics(weeks).find((entry) => entry.key === key)!;

describe("the six ratios", () => {
  const filed = [
    week({
      fiscal_week: 10,
      net_income: 50_000,
      earnings: 100_000,
      taxes: 10_000,
      current_assets: 1,
      current_liabilities: 1,
      total_liabilities: 1,
      total_equity: 1,
      lost_customers: 1,
      total_customers: 1,
    }),
    week({
      fiscal_week: 11,
      net_income: 100_000,
      non_cash_expenses: 20_000,
      working_capital_change: -5_000,
      earnings: 200_000,
      taxes: 30_000,
      depreciation: 10_000,
      amortisation: 5_000,
      current_assets: 500_000,
      current_liabilities: 250_000,
      total_liabilities: 400_000,
      total_equity: 800_000,
      lost_customers: 2,
      total_customers: 40,
    }),
  ];

  it("reads operating cash flow from the latest week", () => {
    // 100 000 + 20 000 - 5 000. Week 10 is not added in: this is a weekly flow.
    expect(metric(filed, "operating_cash_flow").value).toBe(115_000);
  });

  it("adds EBITDA across the quarter", () => {
    // Week 10: 100 000 + 10 000. Week 11: 200 000 + 30 000 + 10 000 + 5 000.
    expect(metric(filed, "ebitda").value).toBe(355_000);
    expect(metric(filed, "ebitda").basis).toBe("2 weeks filed");
  });

  // The distinction that governs the whole module.
  it("does not sum balance-sheet positions across weeks", () => {
    // Adding both weeks would give 500 001 - 250 001. A position is what it is
    // on the day, so this reads week 11 alone.
    expect(metric(filed, "working_capital").value).toBe(250_000);
  });

  // The brief shows both of these as percentages, so 0.5 reads as 50%.
  it("computes debt to equity at the latest week", () => {
    expect(metric(filed, "debt_to_equity").value).toBe(50);
  });

  it("computes the current ratio at the latest week", () => {
    expect(metric(filed, "current_ratio").value).toBe(200);
  });

  it("computes churn as a percentage", () => {
    expect(metric(filed, "churn").value).toBe(5);
  });

  it("takes the highest week number as latest, not the array order", () => {
    const reversed = [...filed].reverse();
    expect(metric(reversed, "operating_cash_flow").value).toBe(115_000);
  });
});

describe("questions that cannot be answered", () => {
  it("reports no debt-to-equity when equity is zero", () => {
    const result = metric([week({ total_liabilities: 100, total_equity: 0 })], "debt_to_equity");
    expect(result.value).toBeNull();
  });

  it("reports no current ratio when there are no current liabilities", () => {
    const result = metric([week({ current_assets: 100, current_liabilities: 0 })], "current_ratio");
    expect(result.value).toBeNull();
  });

  it("reports no churn when there are no customers", () => {
    const result = metric([week({ lost_customers: 0, total_customers: 0 })], "churn");
    expect(result.value).toBeNull();
  });

  it("never yields Infinity or NaN", () => {
    for (const entry of financeMetrics([week({ total_liabilities: 5, total_equity: 0 })])) {
      expect(entry.value === null || Number.isFinite(entry.value)).toBe(true);
    }
  });

  it("allows a negative ratio, since equity can be negative", () => {
    const result = metric([week({ total_liabilities: 100, total_equity: -50 })], "debt_to_equity");
    expect(result.value).toBe(-200);
  });
});

describe("before anything is filed", () => {
  it("returns every metric with no value rather than zero", () => {
    const metrics = financeMetrics([]);
    expect(metrics).toHaveLength(6);
    for (const entry of metrics) {
      expect(entry.value).toBeNull();
      expect(entry.basis).toBe("No figures filed");
    }
  });

  it("still names and defines every metric", () => {
    for (const entry of financeMetrics([])) {
      expect(entry.label.length).toBeGreaterThan(3);
      expect(entry.definition.length).toBeGreaterThan(20);
    }
  });
});
