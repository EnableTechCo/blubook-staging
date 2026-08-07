import { z } from "zod";

export const OPPORTUNITY_SOURCE_CODES = ["team", "web"] as const;

export const FORECAST_CATEGORY_CODES = [
  "open",
  "upside",
  "best_case",
  "commit",
  "booked",
  "closed",
] as const;

const nullableInteger = (minimum: number, maximum: number, message: string) =>
  z.number({ error: message }).int(message).min(minimum, message).max(maximum, message).nullable();

export const salesOpportunityInputSchema = z
  .object({
    opportunitySource: z.enum(OPPORTUNITY_SOURCE_CODES),
    opportunityName: z
      .string()
      .trim()
      .min(1, "Enter an opportunity name")
      .max(240, "Opportunity name must be 240 characters or fewer"),
    forecastCategory: z.enum(FORECAST_CATEGORY_CODES),
    revenue: z
      .number({ error: "Enter the expected revenue" })
      .finite("Enter a valid revenue amount")
      .nonnegative("Revenue cannot be negative")
      .max(999_999_999_999.99, "Revenue is too large"),
    fiscalYear: nullableInteger(2000, 2200, "Enter a valid fiscal year"),
    fiscalQuarter: nullableInteger(1, 4, "Fiscal quarter must be between 1 and 4"),
    fiscalWeek: nullableInteger(1, 13, "Fiscal week must be between 1 and 13"),
  })
  .superRefine((value, context) => {
    if (value.fiscalQuarter !== null && value.fiscalYear === null) {
      context.addIssue({
        code: "custom",
        path: ["fiscalYear"],
        message: "Choose a fiscal year before selecting a quarter",
      });
    }

    if (value.fiscalWeek !== null && value.fiscalQuarter === null) {
      context.addIssue({
        code: "custom",
        path: ["fiscalQuarter"],
        message: "Choose a fiscal quarter before selecting a week",
      });
    }
  });

export type SalesOpportunityInput = z.infer<typeof salesOpportunityInputSchema>;
