import { z } from "zod";
import { FISCAL_QUARTERS } from "@/lib/time";

// Matches the column constraints on client_sales_targets, so a value the form
// accepts is one the database will accept too.
export const salesTargetInputSchema = z.object({
  fiscalYear: z
    .number({ error: "Choose a fiscal year" })
    .int("Choose a fiscal year")
    .min(2000, "Choose a fiscal year")
    .max(2200, "Choose a fiscal year"),
  fiscalQuarter: z
    .number({ error: "Choose a quarter" })
    .int("Choose a quarter")
    .min(1, "Choose a quarter")
    .max(FISCAL_QUARTERS, "Choose a quarter"),
  revenueTarget: z
    .number({ error: "Enter the revenue target" })
    .finite("Enter a valid target amount")
    .nonnegative("A target cannot be negative")
    .max(999_999_999_999.99, "That target is too large"),
});

export type SalesTargetInput = z.infer<typeof salesTargetInputSchema>;

/**
 * Splits a quarterly target across the thirteen weeks of its quarter, returning
 * the cumulative figure for each week — which is what a phasing chart plots.
 *
 * Even phasing stays the default and does the work for you: enter one quarterly
 * number and every week gets its share, exactly as the workbook does.
 *
 * A week the client has set explicitly keeps its own figure, and whatever is
 * left of the quarter is shared evenly across the weeks they have not set. So
 * naming week nine as a big one does not force them to restate the other
 * twelve — the calculation still covers the rest.
 *
 * The division is done on the cumulative value rather than by adding a rounded
 * weekly amount repeatedly, so rounding cannot drift the last week away from
 * the target the client actually entered.
 */
export function phaseTargetAcrossQuarter(
  target: number,
  weeks: number,
  weeklyOverrides: Record<number, number> = {},
): number[] {
  const overridden = Object.entries(weeklyOverrides)
    .map(([week, amount]) => [Number(week), amount] as const)
    .filter(([week]) => week >= 1 && week <= weeks);

  if (overridden.length === 0) {
    return Array.from({ length: weeks }, (_, index) => (target * (index + 1)) / weeks);
  }

  const explicitTotal = overridden.reduce((total, [, amount]) => total + amount, 0);
  const byWeek = new Map(overridden);
  const unsetCount = weeks - byWeek.size;

  // Clamped at zero: overrides that already exceed the quarter leave nothing to
  // share, and a negative share would pull the cumulative line backwards.
  const share = unsetCount > 0 ? Math.max(target - explicitTotal, 0) / unsetCount : 0;

  let running = 0;
  return Array.from({ length: weeks }, (_, index) => {
    running += byWeek.get(index + 1) ?? share;
    return running;
  });
}

/** The evenly phased amount for one week, shown as the placeholder a client is overriding. */
export function evenWeeklyShare(target: number, weeks: number): number {
  return target / weeks;
}
