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

// Weekly targets reshape the phasing without replacing the calculation: the
// weeks a client has not set still share what is left of the quarter.
describe("weekly overrides", () => {
  it("keeps even phasing when no week is set", () => {
    expect(phaseTargetAcrossQuarter(780_000, 13, {})).toEqual(
      phaseTargetAcrossQuarter(780_000, 13),
    );
  });

  it("gives an overridden week its own figure", () => {
    const phased = phaseTargetAcrossQuarter(130_000, 13, { 1: 40_000 });
    expect(phased[0]).toBe(40_000);
  });

  it("shares the remainder evenly across the weeks left unset", () => {
    // 130 000 with week one set to 40 000 leaves 90 000 across twelve weeks.
    const phased = phaseTargetAcrossQuarter(130_000, 13, { 1: 40_000 });
    expect(phased[1]! - phased[0]!).toBeCloseTo(7_500);
    expect(phased.at(-1)).toBeCloseTo(130_000);
  });

  it("still lands on the quarter total once every week is set", () => {
    const overrides = Object.fromEntries(
      Array.from({ length: 13 }, (_, index) => [index + 1, 10_000]),
    );
    expect(phaseTargetAcrossQuarter(130_000, 13, overrides).at(-1)).toBe(130_000);
  });

  it("never runs the line backwards when overrides exceed the quarter", () => {
    const phased = phaseTargetAcrossQuarter(10_000, 13, { 1: 50_000 });
    for (let index = 1; index < phased.length; index += 1) {
      expect(phased[index]!).toBeGreaterThanOrEqual(phased[index - 1]!);
    }
    expect(phased[0]).toBe(50_000);
  });

  it("ignores a week outside the quarter", () => {
    expect(phaseTargetAcrossQuarter(130_000, 13, { 99: 1_000 }).at(-1)).toBe(130_000);
  });
});
