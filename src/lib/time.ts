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
