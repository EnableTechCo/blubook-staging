import { describe, expect, it } from "vitest";
import { isSameSastDay, sastCalendarDate, sastDateKey } from "@/lib/time";
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
