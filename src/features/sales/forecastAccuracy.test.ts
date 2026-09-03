import { describe, expect, it } from "vitest";
import { buildForecastAccuracySeries, summariseForecastAccuracy } from "@/features/sales/forecastAccuracy";

describe("summariseForecastAccuracy", () => {
  it("measures actual bookings against the end of their forecast week", () => {
    const summary = summariseForecastAccuracy([
      // FY2026 starts on 1 March; week one ends on 7 March.
      { fiscal_year: 2026, fiscal_quarter: 1, fiscal_week: 1, booked_at: "2026-03-06T10:00:00Z" },
      { fiscal_year: 2026, fiscal_quarter: 1, fiscal_week: 1, booked_at: "2026-03-09T10:00:00Z" },
    ]);

    expect(summary.measuredBookings).toBe(2);
    expect(summary.onTimeBookings).toBe(1);
    expect(summary.onTimeRate).toBe(0.5);
    expect(summary.averageVarianceDays).toBe(0.5);
  });

  it("excludes bookings without a usable forecast period", () => {
    const summary = summariseForecastAccuracy([
      { fiscal_year: 2026, fiscal_quarter: null, fiscal_week: null, booked_at: "2026-03-06T10:00:00Z" },
    ]);

    expect(summary).toEqual({
      measuredBookings: 0,
      onTimeBookings: 0,
      onTimeRate: null,
      averageVarianceDays: null,
    });
  });
});

  it("builds a cumulative forecast versus actual weekly timeline", () => {
    const points = buildForecastAccuracySeries({
      fiscalYear: 2026,
      fiscalQuarter: 1,
      opportunities: [
        { fiscal_year: 2026, fiscal_quarter: 1, fiscal_week: 1, booked_at: "2026-03-06T10:00:00Z" },
        { fiscal_year: 2026, fiscal_quarter: 1, fiscal_week: 2, booked_at: "2026-03-16T10:00:00Z" },
      ],
    });

    expect(points[0]).toEqual({ week: 1, forecasted: 1, actual: 1 });
    expect(points[1]).toEqual({ week: 2, forecasted: 2, actual: 1 });
    expect(points[2]).toEqual({ week: 3, forecasted: 2, actual: 2 });
  });