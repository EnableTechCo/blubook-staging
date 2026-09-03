import { describe, expect, it } from "vitest";
import { dueState } from "@/features/tasks/board";

// Date arithmetic near a boundary is where this kind of helper goes wrong, and
// the failure is quiet: a task reads "due tomorrow" on the morning it is due.
const on = (iso: string) => new Date(`${iso}T09:00:00`);

describe("dueState", () => {
  it("says nothing when there is no due date", () => {
    expect(dueState(null)).toEqual({ label: "", tone: "none" });
  });

  it("calls the day itself due today", () => {
    expect(dueState("2026-09-10", on("2026-09-10"))).toEqual({
      label: "Due today",
      tone: "soon",
    });
  });

  it("reads the same at either end of that day", () => {
    // The column is a date, so the hour must not change the verdict.
    const early = dueState("2026-09-10", new Date("2026-09-10T00:05:00"));
    const late = dueState("2026-09-10", new Date("2026-09-10T23:55:00"));
    expect(early).toEqual(late);
    expect(early.tone).toBe("soon");
  });

  it("distinguishes tomorrow from later this week", () => {
    expect(dueState("2026-09-11", on("2026-09-10")).label).toBe("Due tomorrow");
    expect(dueState("2026-09-15", on("2026-09-10")).label).toBe("Due in 5 days");
  });

  it("counts overdue days, and singularises one", () => {
    expect(dueState("2026-09-09", on("2026-09-10"))).toEqual({
      label: "1 day overdue",
      tone: "overdue",
    });
    expect(dueState("2026-09-07", on("2026-09-10"))).toEqual({
      label: "3 days overdue",
      tone: "overdue",
    });
  });

  it("stops counting past a week and shows the date instead", () => {
    expect(dueState("2026-09-30", on("2026-09-10"))).toEqual({
      label: "Due 2026-09-30",
      tone: "later",
    });
  });

  it("holds across a month boundary", () => {
    expect(dueState("2026-10-01", on("2026-09-30")).label).toBe("Due tomorrow");
    expect(dueState("2026-09-30", on("2026-10-01")).label).toBe("1 day overdue");
  });

  it("holds across a year boundary", () => {
    expect(dueState("2027-01-01", on("2026-12-31")).label).toBe("Due tomorrow");
  });
});
