import { describe, expect, it } from "vitest";
import { salesOpportunityInputSchema } from "@/lib/validation/salesOpportunities";

const completeOpportunity = {
  opportunitySource: "team" as const,
  opportunityName: "Department of Education",
  forecastCategory: "commit" as const,
  revenue: 100_000,
  fiscalYear: 2026,
  fiscalQuarter: 4,
  fiscalWeek: 2,
};

describe("salesOpportunityInputSchema", () => {
  it("accepts a complete opportunity", () => {
    expect(salesOpportunityInputSchema.safeParse(completeOpportunity).success).toBe(true);
  });

  it("accepts an early opportunity without an expected-payment period", () => {
    expect(
      salesOpportunityInputSchema.safeParse({
        ...completeOpportunity,
        forecastCategory: "open",
        revenue: 0,
        fiscalYear: null,
        fiscalQuarter: null,
        fiscalWeek: null,
      }).success,
    ).toBe(true);
  });

  it("trims the opportunity name", () => {
    const result = salesOpportunityInputSchema.parse({
      ...completeOpportunity,
      opportunityName: "  MTN  ",
    });

    expect(result.opportunityName).toBe("MTN");
  });

  it("rejects an unsupported source or category", () => {
    expect(
      salesOpportunityInputSchema.safeParse({
        ...completeOpportunity,
        opportunitySource: "referral",
      }).success,
    ).toBe(false);
    expect(
      salesOpportunityInputSchema.safeParse({
        ...completeOpportunity,
        forecastCategory: "won",
      }).success,
    ).toBe(false);
  });

  it("rejects negative revenue", () => {
    expect(
      salesOpportunityInputSchema.safeParse({ ...completeOpportunity, revenue: -1 }).success,
    ).toBe(false);
  });

  it("requires a year before a quarter", () => {
    const result = salesOpportunityInputSchema.safeParse({
      ...completeOpportunity,
      fiscalYear: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ["fiscalYear"] }),
      );
    }
  });

  it("requires a quarter before a week", () => {
    const result = salesOpportunityInputSchema.safeParse({
      ...completeOpportunity,
      fiscalQuarter: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ["fiscalQuarter"] }),
      );
    }
  });

  it("enforces fiscal period bounds", () => {
    expect(
      salesOpportunityInputSchema.safeParse({ ...completeOpportunity, fiscalQuarter: 5 }).success,
    ).toBe(false);
    expect(
      salesOpportunityInputSchema.safeParse({ ...completeOpportunity, fiscalWeek: 14 }).success,
    ).toBe(false);
  });
});
