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
 * Splits a quarterly target across the thirteen weeks of its quarter, which is
 * how the workbook phases it: a flat weekly step, accumulating to the full
 * target in the final week.
 *
 * The division is done on the cumulative value rather than by adding a rounded
 * weekly amount thirteen times, so rounding cannot drift the last week away
 * from the target the client actually entered.
 */
export function phaseTargetAcrossQuarter(target: number, weeks: number): number[] {
  return Array.from({ length: weeks }, (_, index) => (target * (index + 1)) / weeks);
}
