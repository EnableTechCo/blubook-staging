// BluBook operates in South Africa, so every timestamp is presented in South
// African Standard Time (UTC+2) no matter where the code runs.
//
// The `en-ZA` locale alone is not enough: it fixes the formatting conventions
// (day before month, 24-hour clock) but not the zone. Without an explicit
// timeZone, a server component renders in the host's zone — UTC on Vercel — and
// a client component renders in the viewer's, so the same request shows two
// different times and SLA columns read two hours early on the server.

export const SAST = "Africa/Johannesburg";

export const SAST_LOCALE = "en-ZA";

// en-CA yields YYYY-MM-DD, giving a sortable calendar-date key for the day a
// timestamp falls on *in SAST*. Comparing raw Date getters instead would use
// the host zone and mis-bucket anything between midnight and 02:00 SAST.
const sastDateKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: SAST,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function sastDateKey(value: Date): string {
  return sastDateKeyFormat.format(value);
}

export function isSameSastDay(left: Date, right: Date): boolean {
  return sastDateKey(left) === sastDateKey(right);
}

// Midnight UTC on the SAST calendar date, so day/week/quarter arithmetic runs
// on the date South African users actually see.
export function sastCalendarDate(value: Date): Date {
  const [year, month, day] = sastDateKey(value).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// ---------------------------------------------------------------------------
// Fiscal calendar
// ---------------------------------------------------------------------------
//
// Reporting runs on the South African tax year: 1 March to the end of February,
// divided into four thirteen-week quarters. The sales workbook is built on that
// shape — every phasing chart has exactly thirteen columns — so the calendar
// here guarantees thirteen weeks per quarter rather than deriving them from
// month boundaries, which would give quarters of unequal length.
//
// Thirteen weeks times four is 364 days, one or two short of a real year. The
// remainder is absorbed into the final week rather than spilling into a week 53:
// a 53rd week would leave the last quarter with fourteen columns and no target
// to plot against. So Q4 week 13 runs eight or nine days. It is the only week
// that is not exactly seven, and it is the week least likely to be examined
// closely, since the quarter has already closed by the time it matters.

export const FISCAL_YEAR_START_MONTH = 3; // March

export const FISCAL_WEEKS_PER_QUARTER = 13;

export const FISCAL_QUARTERS = 4;

const FISCAL_WEEKS_PER_YEAR = FISCAL_WEEKS_PER_QUARTER * FISCAL_QUARTERS;

const MS_PER_DAY = 86_400_000;

export interface FiscalPeriod {
  /** Calendar year the fiscal year opened in: 1 March 2026 starts fiscal 2026. */
  year: number;
  /** 1–52 across the whole year. */
  week: number;
  quarter: number;
  /** 1–13 within the quarter — what the workbook's columns count. */
  quarterWeek: number;
}

/** Midnight UTC on 1 March of the given fiscal year. */
export function fiscalYearStart(fiscalYear: number): Date {
  return new Date(Date.UTC(fiscalYear, FISCAL_YEAR_START_MONTH - 1, 1));
}

/** The fiscal year a SAST calendar date belongs to. January falls in the previous one. */
export function fiscalYearOf(value: Date): number {
  const date = sastCalendarDate(value);
  const year = date.getUTCFullYear();
  return date.getUTCMonth() + 1 < FISCAL_YEAR_START_MONTH ? year - 1 : year;
}

/** Where a moment sits in the fiscal calendar, in SAST. */
export function sastFiscalPeriod(value: Date): FiscalPeriod {
  const year = fiscalYearOf(value);
  const elapsedDays = Math.floor(
    (sastCalendarDate(value).getTime() - fiscalYearStart(year).getTime()) / MS_PER_DAY,
  );
  // Clamped so the leap-day tail reports as week 52 rather than a 53rd week.
  const week = Math.min(Math.floor(elapsedDays / 7) + 1, FISCAL_WEEKS_PER_YEAR);
  const quarter = Math.floor((week - 1) / FISCAL_WEEKS_PER_QUARTER) + 1;

  return {
    year,
    week,
    quarter,
    quarterWeek: week - (quarter - 1) * FISCAL_WEEKS_PER_QUARTER,
  };
}

/**
 * Half-open date range of one fiscal week, for bucketing actuals. `end` is the
 * first instant of the following week, so a row belongs to the week where
 * `start <= value < end` and no row can land in two buckets.
 */
export function fiscalWeekRange(fiscalYear: number, week: number): { start: Date; end: Date } {
  const yearStart = fiscalYearStart(fiscalYear).getTime();
  const start = new Date(yearStart + (week - 1) * 7 * MS_PER_DAY);
  const end =
    week >= FISCAL_WEEKS_PER_YEAR
      ? fiscalYearStart(fiscalYear + 1) // absorbs the spare day(s)
      : new Date(yearStart + week * 7 * MS_PER_DAY);

  return { start, end };
}

/** The thirteen week numbers of a quarter, in order — the columns of a phasing chart. */
export function fiscalQuarterWeeks(quarter: number): number[] {
  const first = (quarter - 1) * FISCAL_WEEKS_PER_QUARTER + 1;
  return Array.from({ length: FISCAL_WEEKS_PER_QUARTER }, (_, index) => first + index);
}
