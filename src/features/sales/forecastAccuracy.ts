import { FISCAL_WEEKS_PER_QUARTER, fiscalWeekRange, sastCalendarDate, sastFiscalPeriod } from "@/lib/time";

export interface ForecastAccuracyOpportunity {
  fiscal_year: number | null;
  fiscal_quarter: number | null;
  fiscal_week: number | null;
  booked_at?: string | null;
}

export interface ForecastAccuracySummary {
  measuredBookings: number;
  onTimeBookings: number;
  onTimeRate: number | null;
  /** Negative means booked early; positive means booked after its forecast week. */
  averageVarianceDays: number | null;
}

const MS_PER_DAY = 86_400_000;

export interface ForecastAccuracyPoint {
  week: number;
  forecasted: number;
  actual: number;
}

/**
 * Compares a booked opportunity's actual SAST calendar date with the last day
 * of the fiscal week it was forecast into. A fiscal week is the planning
 * promise already present on every sales opportunity, so this remains useful
 * even for historical records that have no individual target date.
 */
export function summariseForecastAccuracy(
  opportunities: ForecastAccuracyOpportunity[],
): ForecastAccuracySummary {
  let onTimeBookings = 0;
  const variances: number[] = [];

  for (const opportunity of opportunities) {
    if (
      !opportunity.booked_at ||
      !opportunity.fiscal_year ||
      !opportunity.fiscal_quarter ||
      !opportunity.fiscal_week
    ) continue;

    const actual = new Date(opportunity.booked_at);
    if (Number.isNaN(actual.getTime())) continue;

    const fiscalWeek =
      (opportunity.fiscal_quarter - 1) * FISCAL_WEEKS_PER_QUARTER + opportunity.fiscal_week;
    const { end } = fiscalWeekRange(opportunity.fiscal_year, fiscalWeek);
    const forecastClose = new Date(end.getTime() - MS_PER_DAY);
    const variance = Math.round(
      (sastCalendarDate(actual).getTime() - forecastClose.getTime()) / MS_PER_DAY,
    );

    variances.push(variance);
    if (variance <= 0) onTimeBookings += 1;
  }

  const measuredBookings = variances.length;
  return {
    measuredBookings,
    onTimeBookings,
    onTimeRate: measuredBookings ? onTimeBookings / measuredBookings : null,
    averageVarianceDays: measuredBookings
      ? variances.reduce((total, variance) => total + variance, 0) / measuredBookings
      : null,
  };
}

/** Cumulative forecast-week and actual-booking-week timeline for the report. */
export function buildForecastAccuracySeries({
  opportunities,
  fiscalYear,
  fiscalQuarter,
}: {
  opportunities: ForecastAccuracyOpportunity[];
  fiscalYear: number;
  fiscalQuarter: number;
}): ForecastAccuracyPoint[] {
  const forecasted = new Array<number>(FISCAL_WEEKS_PER_QUARTER).fill(0);
  const actual = new Array<number>(FISCAL_WEEKS_PER_QUARTER).fill(0);

  for (const opportunity of opportunities) {
    if (
      opportunity.fiscal_year !== fiscalYear ||
      opportunity.fiscal_quarter !== fiscalQuarter ||
      !opportunity.fiscal_week ||
      !opportunity.booked_at
    ) continue;

    forecasted[opportunity.fiscal_week - 1] += 1;
    const booked = new Date(opportunity.booked_at);
    if (Number.isNaN(booked.getTime())) continue;
    const actualPeriod = sastFiscalPeriod(booked);
    if (actualPeriod.year === fiscalYear && actualPeriod.quarter === fiscalQuarter) {
      actual[actualPeriod.quarterWeek - 1] += 1;
    }
  }

  let forecastRunning = 0;
  let actualRunning = 0;
  return forecasted.map((count, index) => {
    forecastRunning += count;
    actualRunning += actual[index]!;
    return { week: index + 1, forecasted: forecastRunning, actual: actualRunning };
  });
}