import { describe, expect, it } from "vitest";
import {
  fiscalQuarterWeeks,
  fiscalWeekRange,
  fiscalYearOf,
  isSameSastDay,
  sastCalendarDate,
  sastDateKey,
  sastFiscalPeriod,
  sastFiscalPeriodForDate,
} from "@/lib/time";
import { formatDate } from "@/features/dashboard/ui";
import { messageTime } from "@/features/messages/ui";

// 23:00 UTC on 31 July is already 01:00 on 1 August in Johannesburg. Every
// assertion below uses that instant, because it is the case that silently
// renders a day early on UTC infrastructure while looking correct on a South
// African developer's machine.
const LATE_JULY_UTC = "2026-07-31T23:00:00.000Z";

describe("SAST date handling", () => {
  it("buckets a late-evening UTC instant into the next South African day", () => {
    expect(sastDateKey(new Date(LATE_JULY_UTC))).toBe("2026-08-01");
  });

  it("treats two instants either side of UTC midnight as the same SAST day", () => {
    expect(
      isSameSastDay(new Date("2026-08-01T21:00:00.000Z"), new Date("2026-08-01T05:00:00.000Z")),
    ).toBe(true);
  });

  it("does not treat instants on different SAST days as the same day", () => {
    expect(isSameSastDay(new Date(LATE_JULY_UTC), new Date("2026-07-31T12:00:00.000Z"))).toBe(false);
  });

  it("returns the SAST calendar date for week and quarter arithmetic", () => {
    const date = sastCalendarDate(new Date(LATE_JULY_UTC));
    expect(date.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(date.getUTCMonth()).toBe(7); // August, not July
  });
});

describe("fiscal calendar", () => {
  it("opens the fiscal year on 1 March", () => {
    expect(sastFiscalPeriod(new Date("2026-03-01T08:00:00.000Z"))).toEqual({
      year: 2026,
      week: 1,
      quarter: 1,
      quarterWeek: 1,
    });
  });

  it("counts February into the fiscal year that opened the previous March", () => {
    expect(fiscalYearOf(new Date("2027-02-20T08:00:00.000Z"))).toBe(2026);
    expect(fiscalYearOf(new Date("2026-03-01T08:00:00.000Z"))).toBe(2026);
  });

  // The brief's mock sits at "Week 11", and this is the date it was written.
  it("places 11 August 2026 in Q2 week 11", () => {
    expect(sastFiscalPeriod(new Date("2026-08-11T10:00:00.000Z"))).toEqual({
      year: 2026,
      week: 24,
      quarter: 2,
      quarterWeek: 11,
    });
  });

  it("derives a fiscal period from a selected expected close date", () => {
    expect(sastFiscalPeriodForDate("2026-08-11")).toMatchObject({
      year: 2026,
      quarter: 2,
      quarterWeek: 11,
    });
  });

  it("starts each quarter at week 1 again", () => {
    // Week 14 overall is the first week of Q2: 13 weeks x 7 days after 1 March.
    const q2Start = new Date("2026-03-01T00:00:00.000Z").getTime() + 13 * 7 * 86_400_000;
    expect(sastFiscalPeriod(new Date(q2Start))).toMatchObject({ quarter: 2, quarterWeek: 1 });
  });

  it("keeps the last days of the year in week 52 rather than opening a week 53", () => {
    // 364 days of full weeks leaves 28 February outside week 52's seven days.
    const period = sastFiscalPeriod(new Date("2027-02-28T10:00:00.000Z"));
    expect(period).toMatchObject({ year: 2026, week: 52, quarter: 4, quarterWeek: 13 });
  });

  it("uses the South African day when a UTC instant falls either side of midnight", () => {
    // 22:30 UTC on 28 February is already 1 March in Johannesburg, so this is
    // week 1 of the new fiscal year and not the last week of the old one.
    expect(sastFiscalPeriod(new Date("2027-02-28T22:30:00.000Z"))).toMatchObject({
      year: 2027,
      week: 1,
    });
  });

  it("gives each week a half-open range so no date lands in two buckets", () => {
    const first = fiscalWeekRange(2026, 1);
    const second = fiscalWeekRange(2026, 2);

    expect(first.start.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(first.end.toISOString()).toBe("2026-03-08T00:00:00.000Z");
    expect(second.start.toISOString()).toBe(first.end.toISOString());
  });

  it("runs the final week up to the next fiscal year, absorbing the spare days", () => {
    const last = fiscalWeekRange(2026, 52);
    expect(last.end.toISOString()).toBe("2027-03-01T00:00:00.000Z");
    // 2027 is not a leap year, so the tail is eight days rather than seven.
    const days = (last.end.getTime() - last.start.getTime()) / 86_400_000;
    expect(days).toBe(8);
  });

  it("lists thirteen ordered week numbers per quarter", () => {
    expect(fiscalQuarterWeeks(1)).toHaveLength(13);
    expect(fiscalQuarterWeeks(2)[0]).toBe(14);
    expect(fiscalQuarterWeeks(4).at(-1)).toBe(52);
  });
});

describe("timestamp rendering", () => {
  it("formatDate shows the South African day, not the host's", () => {
    const rendered = formatDate(LATE_JULY_UTC);
    expect(rendered).toContain("Aug");
    expect(rendered).toContain("2026");
    expect(rendered).not.toContain("Jul");
  });

  it("messageTime shows the South African day and time", () => {
    const rendered = messageTime(LATE_JULY_UTC);
    expect(rendered).toContain("Aug");
    expect(rendered).toContain("01:00");
    expect(rendered).not.toContain("23:00");
  });
});
