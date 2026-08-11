import { describe, expect, it } from "vitest";
import { phaseTargetAcrossQuarter, salesTargetInputSchema } from "@/lib/validation/salesTargets";

describe("salesTargetInputSchema", () => {
  it("accepts a whole quarter's target", () => {
    const parsed = salesTargetInputSchema.safeParse({
      fiscalYear: 2026,
      fiscalQuarter: 4,
      revenueTarget: 780_000,
    });
    expect(parsed.success).toBe(true);
  });

  it("allows a target of zero, which is a real answer", () => {
    expect(
      salesTargetInputSchema.safeParse({ fiscalYear: 2026, fiscalQuarter: 1, revenueTarget: 0 })
        .success,
    ).toBe(true);
  });

  it("rejects a negative target", () => {
    const parsed = salesTargetInputSchema.safeParse({
      fiscalYear: 2026,
      fiscalQuarter: 1,
      revenueTarget: -1,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a quarter outside the four", () => {
    expect(
      salesTargetInputSchema.safeParse({ fiscalYear: 2026, fiscalQuarter: 5, revenueTarget: 100 })
        .success,
    ).toBe(false);
  });
});

// The workbook's own sample: R780 000 over thirteen weeks, R60 000 a week.
describe("phaseTargetAcrossQuarter", () => {
  it("reproduces the workbook's flat phasing", () => {
    const phased = phaseTargetAcrossQuarter(780_000, 13);
    expect(phased).toHaveLength(13);
    expect(phased[0]).toBe(60_000);
    expect(phased[1]).toBe(120_000);
    expect(phased.at(-1)).toBe(780_000);
  });

  it("lands exactly on the target even when it does not divide evenly", () => {
    // Adding a rounded weekly step thirteen times would drift; dividing the
    // cumulative value cannot, so the final week is the figure entered.
    const phased = phaseTargetAcrossQuarter(100_000, 13);
    expect(phased.at(-1)).toBe(100_000);
  });

  it("phases a zero target as a flat zero line rather than nothing", () => {
    expect(phaseTargetAcrossQuarter(0, 13)).toEqual(Array(13).fill(0));
  });
});
