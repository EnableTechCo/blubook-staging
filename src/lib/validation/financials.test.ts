import { describe, expect, it } from "vitest";
import { FINANCIAL_FIELDS, financialSubmissionSchema } from "@/lib/validation/financials";

const valid = {
  clientId: "3f1a9c2e-7b4d-4e8a-9f10-2c5d6e7a8b90",
  fiscalYear: 2026,
  fiscalQuarter: 2,
  fiscalWeek: 11,
  netIncome: 100_000,
  nonCashExpenses: 20_000,
  workingCapitalChange: -5_000,
  earnings: 200_000,
  taxes: 30_000,
  depreciation: 10_000,
  amortisation: 5_000,
  currentAssets: 500_000,
  currentLiabilities: 250_000,
  totalLiabilities: 400_000,
  totalEquity: 800_000,
  lostCustomers: 2,
  totalCustomers: 40,
};

describe("financialSubmissionSchema", () => {
  it("accepts a complete week", () => {
    expect(financialSubmissionSchema.safeParse(valid).success).toBe(true);
  });

  // A loss is a real answer, and so is a working capital release.
  it("allows negative income, equity and working capital movement", () => {
    for (const field of ["netIncome", "workingCapitalChange", "totalEquity"] as const) {
      const parsed = financialSubmissionSchema.safeParse({ ...valid, [field]: -1_000 });
      expect(parsed.success, field).toBe(true);
    }
  });

  it("refuses negative assets and liabilities", () => {
    for (const field of ["currentAssets", "currentLiabilities", "totalLiabilities"] as const) {
      const parsed = financialSubmissionSchema.safeParse({ ...valid, [field]: -1 });
      expect(parsed.success, field).toBe(false);
    }
  });

  it("refuses losing more customers than exist", () => {
    const parsed = financialSubmissionSchema.safeParse({
      ...valid,
      lostCustomers: 41,
      totalCustomers: 40,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toMatch(/cannot exceed total customers/);
  });

  it("allows every customer to be lost, which is churn of 100%", () => {
    expect(
      financialSubmissionSchema.safeParse({ ...valid, lostCustomers: 40, totalCustomers: 40 })
        .success,
    ).toBe(true);
  });

  it("refuses a fiscal week outside the thirteen", () => {
    expect(financialSubmissionSchema.safeParse({ ...valid, fiscalWeek: 14 }).success).toBe(false);
    expect(financialSubmissionSchema.safeParse({ ...valid, fiscalWeek: 0 }).success).toBe(false);
  });

  it("refuses a customer count that is not whole", () => {
    expect(financialSubmissionSchema.safeParse({ ...valid, totalCustomers: 4.5 }).success).toBe(
      false,
    );
  });
});

describe("FINANCIAL_FIELDS", () => {
  // The form is generated from this list, so a field missing here is a figure
  // the dashboard will silently read as zero.
  it("covers every input the schema requires", () => {
    const listed = FINANCIAL_FIELDS.flatMap((group) => group.fields.map((field) => field.name));
    const required = Object.keys(valid).filter(
      (key) => !["clientId", "fiscalYear", "fiscalQuarter", "fiscalWeek"].includes(key),
    );
    expect([...listed].sort()).toEqual([...required].sort());
  });

  it("states the formula each group feeds", () => {
    for (const group of FINANCIAL_FIELDS) {
      expect(group.formula.length).toBeGreaterThan(10);
    }
  });
});
