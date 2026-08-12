import { z } from "zod";
import { FISCAL_QUARTERS, FISCAL_WEEKS_PER_QUARTER } from "@/lib/time";

// The raw figures a finance partner supplies. Only inputs live here: every
// ratio on the dashboard is derived from these, so there is nothing to keep in
// step when a formula changes.
//
// Grouped the way an accountant would read them rather than the way the table
// stores them, because this list drives the form.
export const FINANCIAL_FIELDS = [
  {
    group: "Operating cash flow",
    formula: "Net income + non-cash expenses + change in working capital",
    fields: [
      { name: "netIncome", label: "Net income" },
      { name: "nonCashExpenses", label: "Non-cash expenses" },
      { name: "workingCapitalChange", label: "Change in working capital" },
    ],
  },
  {
    group: "EBITDA",
    formula: "Earnings + taxes + depreciation + amortisation",
    fields: [
      { name: "earnings", label: "Earnings" },
      { name: "taxes", label: "Taxes" },
      { name: "depreciation", label: "Depreciation" },
      { name: "amortisation", label: "Amortisation" },
    ],
  },
  {
    group: "Balance sheet",
    formula: "Working capital, current ratio and debt-to-equity are read from these",
    fields: [
      { name: "currentAssets", label: "Current assets" },
      { name: "currentLiabilities", label: "Current liabilities" },
      { name: "totalLiabilities", label: "Total liabilities" },
      { name: "totalEquity", label: "Total equity" },
    ],
  },
  {
    group: "Customers",
    formula: "Lost customers ÷ total customers × 100 = churn rate",
    fields: [
      { name: "lostCustomers", label: "Customers lost", integer: true },
      { name: "totalCustomers", label: "Total customers", integer: true },
    ],
  },
] as const;

const amount = z
  .number({ error: "Enter a figure" })
  .finite("Enter a valid figure")
  .max(99_999_999_999_999.99, "That figure is too large")
  .min(-99_999_999_999_999.99, "That figure is too large");

// Assets and liabilities cannot be negative; income and equity can.
const nonNegativeAmount = amount.nonnegative("This cannot be negative");
const count = z
  .number({ error: "Enter a number of customers" })
  .int("Enter a whole number")
  .nonnegative("This cannot be negative")
  .max(100_000_000, "That figure is too large");

export const financialSubmissionSchema = z
  .object({
    clientId: z.string().uuid("Choose a customer"),
    fiscalYear: z.number().int().min(2000).max(2200),
    fiscalQuarter: z.number().int().min(1).max(FISCAL_QUARTERS),
    fiscalWeek: z.number().int().min(1).max(FISCAL_WEEKS_PER_QUARTER),

    netIncome: amount,
    nonCashExpenses: amount,
    workingCapitalChange: amount,
    earnings: amount,
    taxes: amount,
    depreciation: amount,
    amortisation: amount,
    currentAssets: nonNegativeAmount,
    currentLiabilities: nonNegativeAmount,
    totalLiabilities: nonNegativeAmount,
    totalEquity: amount,
    lostCustomers: count,
    totalCustomers: count,
  })
  .refine((value) => value.lostCustomers <= value.totalCustomers, {
    path: ["lostCustomers"],
    message: "Customers lost cannot exceed total customers",
  });

export type FinancialSubmission = z.infer<typeof financialSubmissionSchema>;
