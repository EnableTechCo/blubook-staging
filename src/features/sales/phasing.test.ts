import { describe, expect, it } from "vitest";
import {
  buildPhasingSeries,
  measureByKey,
  summariseQuarter,
  type PhasingOpportunity,
} from "@/features/sales/phasing";

const opportunity = (
  overrides: Partial<PhasingOpportunity> & Pick<PhasingOpportunity, "revenue" | "forecast_category">,
): PhasingOpportunity => ({
  fiscal_year: 2026,
  fiscal_quarter: 2,
  fiscal_week: 1,
  ...overrides,
});

const booked = measureByKey("booked");

describe("buildPhasingSeries", () => {
  it("plots thirteen weeks whatever the data holds", () => {
    const series = buildPhasingSeries({
      opportunities: [],
      measure: booked,
      fiscalYear: 2026,
      fiscalQuarter: 2,
      throughWeek: 13,
      target: 780_000,
    });
    expect(series.points).toHaveLength(13);
  });

  it("phases the target flat, matching the workbook", () => {
    const series = buildPhasingSeries({
      opportunities: [],
      measure: booked,
      fiscalYear: 2026,
      fiscalQuarter: 2,
      throughWeek: 13,
      target: 780_000,
    });
    expect(series.points[0]?.target).toBe(60_000);
    expect(series.points.at(-1)?.target).toBe(780_000);
  });

  it("accumulates actuals rather than reporting them weekly", () => {
    const series = buildPhasingSeries({
      opportunities: [
        opportunity({ revenue: 100, forecast_category: "booked", fiscal_week: 1 }),
        opportunity({ revenue: 50, forecast_category: "closed", fiscal_week: 2 }),
      ],
      measure: booked,
      fiscalYear: 2026,
      fiscalQuarter: 2,
      throughWeek: 13,
      target: null,
    });
    expect(series.points[0]?.actual).toBe(100);
    expect(series.points[1]?.actual).toBe(150);
    expect(series.points[2]?.actual).toBe(150);
  });

  it("stops the actual line after the current week instead of dropping to zero", () => {
    const series = buildPhasingSeries({
      opportunities: [opportunity({ revenue: 100, forecast_category: "booked", fiscal_week: 2 })],
      measure: booked,
      fiscalYear: 2026,
      fiscalQuarter: 2,
      throughWeek: 3,
      target: 130,
    });
    expect(series.points[2]?.actual).toBe(100);
    expect(series.points[3]?.actual).toBeNull();
    expect(series.points.at(-1)?.actual).toBeNull();
    // The target still runs the full quarter — that is the whole point of it.
    expect(series.points.at(-1)?.target).toBe(130);
  });

  it("ignores other quarters and other years", () => {
    const series = buildPhasingSeries({
      opportunities: [
        opportunity({ revenue: 100, forecast_category: "booked" }),
        opportunity({ revenue: 999, forecast_category: "booked", fiscal_quarter: 3 }),
        opportunity({ revenue: 999, forecast_category: "booked", fiscal_year: 2025 }),
      ],
      measure: booked,
      fiscalYear: 2026,
      fiscalQuarter: 2,
      throughWeek: 13,
      target: null,
    });
    expect(series.actualToDate).toBe(100);
  });

  it("counts an opportunity with no week from week one rather than dropping it", () => {
    const series = buildPhasingSeries({
      opportunities: [
        opportunity({ revenue: 100, forecast_category: "booked", fiscal_week: null }),
      ],
      measure: booked,
      fiscalYear: 2026,
      fiscalQuarter: 2,
      throughWeek: 13,
      target: null,
    });
    expect(series.points[0]?.actual).toBe(100);
    expect(series.actualToDate).toBe(100);
  });

  it("distinguishes no target from a target of zero", () => {
    const none = buildPhasingSeries({
      opportunities: [],
      measure: booked,
      fiscalYear: 2026,
      fiscalQuarter: 2,
      throughWeek: 1,
      target: null,
    });
    const zero = buildPhasingSeries({
      opportunities: [],
      measure: booked,
      fiscalYear: 2026,
      fiscalQuarter: 2,
      throughWeek: 1,
      target: 0,
    });
    expect(none.hasTarget).toBe(false);
    expect(zero.hasTarget).toBe(true);
  });

  it("counts only delivered revenue for the booked measure", () => {
    const series = buildPhasingSeries({
      opportunities: [
        opportunity({ revenue: 100, forecast_category: "booked" }),
        opportunity({ revenue: 500, forecast_category: "commit" }),
        opportunity({ revenue: 500, forecast_category: "open" }),
      ],
      measure: booked,
      fiscalYear: 2026,
      fiscalQuarter: 2,
      throughWeek: 13,
      target: null,
    });
    expect(series.actualToDate).toBe(100);
  });

  it("counts the whole book for the pipeline measure", () => {
    const series = buildPhasingSeries({
      opportunities: [
        opportunity({ revenue: 100, forecast_category: "booked" }),
        opportunity({ revenue: 500, forecast_category: "commit" }),
      ],
      measure: measureByKey("weighted"),
      fiscalYear: 2026,
      fiscalQuarter: 2,
      throughWeek: 13,
      target: null,
    });
    expect(series.actualToDate).toBe(600);
  });

  it("falls back to the first measure for an unknown key", () => {
    expect(measureByKey("not-a-measure").key).toBe("booked");
  });
});

describe("summariseQuarter", () => {
  const opportunities = [
    opportunity({ revenue: 635_000, forecast_category: "booked", fiscal_week: 3 }),
    opportunity({ revenue: 180_000, forecast_category: "commit", fiscal_week: 11 }),
    opportunity({ revenue: 80_000, forecast_category: "best_case", fiscal_week: 11 }),
    opportunity({ revenue: 80_000, forecast_category: "upside", fiscal_week: 11 }),
    opportunity({ revenue: 80_000, forecast_category: "open", fiscal_week: 4 }),
  ];

  const summary = summariseQuarter({
    opportunities,
    fiscalYear: 2026,
    fiscalQuarter: 2,
    throughWeek: 11,
    target: 780_000,
  });

  it("reports delivered revenue to date", () => {
    expect(summary.quarterToDate).toBe(635_000);
  });

  it("splits what is still in play by forecast category", () => {
    expect(summary.commit).toBe(180_000);
    expect(summary.bestCase).toBe(80_000);
    expect(summary.upside).toBe(80_000);
  });

  it("counts revenue whose week has passed as slipped", () => {
    // Week 4 is behind week 11 and still open, so it has slipped. The three
    // week-11 deals are due this week and have not.
    expect(summary.slipped).toBe(80_000);
  });

  it("does not count delivered revenue as slipped", () => {
    const delivered = summariseQuarter({
      opportunities: [opportunity({ revenue: 500, forecast_category: "booked", fiscal_week: 1 })],
      fiscalYear: 2026,
      fiscalQuarter: 2,
      throughWeek: 11,
      target: null,
    });
    expect(delivered.slipped).toBe(0);
    expect(delivered.quarterToDate).toBe(500);
  });

  it("excludes revenue booked in a week the quarter has not reached", () => {
    const ahead = summariseQuarter({
      opportunities: [opportunity({ revenue: 500, forecast_category: "booked", fiscal_week: 12 })],
      fiscalYear: 2026,
      fiscalQuarter: 2,
      throughWeek: 11,
      target: null,
    });
    expect(ahead.quarterToDate).toBe(0);
  });
});
