// The six figures on the brief's Finance Dashboard, worked out from the weekly
// inputs a finance partner files. Nothing here is stored: a ratio computed at
// read time can never disagree with the figures it came from, and changing a
// formula never needs a backfill.
//
// The distinction that governs all of this is flow against stock.
//
//   A flow happens over a period. Income, EBITDA and cash movement accumulate,
//   so quarter-to-date means adding the weeks up.
//
//   A stock is a position at a moment. Assets, liabilities, equity and customer
//   counts are what they are on the day. Adding eleven weeks of "current
//   assets" would produce a number that means nothing at all, so these take the
//   latest week filed and never sum.

export interface WeeklyFinancials {
  fiscal_week: number;
  net_income: number;
  non_cash_expenses: number;
  working_capital_change: number;
  earnings: number;
  taxes: number;
  depreciation: number;
  amortisation: number;
  current_assets: number;
  current_liabilities: number;
  total_liabilities: number;
  total_equity: number;
  lost_customers: number;
  total_customers: number;
}

export type RatioFormat = "currency" | "percentage" | "ratio";

export interface FinanceMetric {
  key: string;
  label: string;
  definition: string;
  format: RatioFormat;
  /** Null when the figures needed for it have not been filed. */
  value: number | null;
  /** Which weeks the figure was drawn from, shown under the tile. */
  basis: string;
}

const number = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Latest week filed. Stock measures read from this and only this. */
function latest(weeks: WeeklyFinancials[]): WeeklyFinancials | null {
  if (weeks.length === 0) return null;
  return [...weeks].sort((left, right) => right.fiscal_week - left.fiscal_week)[0]!;
}

function sum(weeks: WeeklyFinancials[], pick: (week: WeeklyFinancials) => number): number {
  return weeks.reduce((total, week) => total + number(pick(week)), 0);
}

/**
 * A quotient that refuses to lie.
 *
 * Dividing by zero equity or zero customers is not a very large ratio, it is an
 * unanswerable question — a company with no equity has no debt-to-equity, and a
 * company with no customers has no churn. Returning null makes the tile say so
 * rather than printing Infinity or NaN.
 */
function quotient(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

export function financeMetrics(weeks: WeeklyFinancials[]): FinanceMetric[] {
  const current = latest(weeks);
  const weekLabel = current ? `Week ${current.fiscal_week}` : "No figures filed";
  const quarterLabel =
    weeks.length === 0
      ? weekLabel
      : weeks.length === 1
        ? "1 week filed"
        : `${weeks.length} weeks filed`;

  return [
    {
      key: "operating_cash_flow",
      label: "Current operating cash flow",
      definition:
        "Net income + non-cash expenses + change in working capital, for the most recent week filed.",
      format: "currency",
      value: current
        ? number(current.net_income) +
          number(current.non_cash_expenses) +
          number(current.working_capital_change)
        : null,
      basis: weekLabel,
    },
    {
      key: "ebitda",
      label: "QTD EBITDA",
      definition:
        "Earnings + taxes + depreciation + amortisation, added across every week filed this quarter.",
      format: "currency",
      value:
        weeks.length === 0
          ? null
          : sum(weeks, (week) => number(week.earnings)) +
            sum(weeks, (week) => number(week.taxes)) +
            sum(weeks, (week) => number(week.depreciation)) +
            sum(weeks, (week) => number(week.amortisation)),
      basis: quarterLabel,
    },
    {
      key: "working_capital",
      label: "Working capital",
      definition:
        "Current assets − current liabilities. A position rather than a flow, so it reads the latest week rather than adding the quarter up.",
      format: "currency",
      value: current ? number(current.current_assets) - number(current.current_liabilities) : null,
      basis: weekLabel,
    },
    {
      key: "debt_to_equity",
      label: "Debt to equity",
      definition:
        "Total liabilities ÷ total equity, at the latest week. Undefined when equity is zero.",
      format: "ratio",
      value: current
        ? quotient(number(current.total_liabilities), number(current.total_equity))
        : null,
      basis: weekLabel,
    },
    {
      key: "current_ratio",
      label: "Current ratio",
      definition:
        "Current assets ÷ current liabilities, at the latest week. Undefined when there are no current liabilities.",
      format: "ratio",
      value: current
        ? quotient(number(current.current_assets), number(current.current_liabilities))
        : null,
      basis: weekLabel,
    },
    {
      key: "churn",
      label: "Churn rate",
      definition:
        "Customers lost ÷ total customers, at the latest week. These are the client's own customers, not BluBook's.",
      format: "percentage",
      value: current
        ? (() => {
            const share = quotient(
              number(current.lost_customers),
              number(current.total_customers),
            );
            return share === null ? null : share * 100;
          })()
        : null,
      basis: weekLabel,
    },
  ];
}
