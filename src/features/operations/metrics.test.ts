import { describe, expect, it } from "vitest";
import { currentWeekWindow, operationsMetric, OPERATIONS_METRICS, type WeekWindow } from "@/features/operations/metrics";
import type { RequestRow } from "@/services/dashboard";

// A window with known edges, so tests do not depend on the day they run.
const window: WeekWindow = {
  start: new Date("2026-08-10T00:00:00.000Z"),
  end: new Date("2026-08-17T00:00:00.000Z"),
  week: 24,
  quarterWeek: 11,
  year: 2026,
  quarter: 2,
};

const request = (overrides: Partial<RequestRow>): RequestRow =>
  ({
    id: crypto.randomUUID(),
    reference: "SYS-000001",
    title: "Request",
    status: "completed",
    origin: "system",
    created_at: "2026-08-11T09:00:00.000Z",
    completed_at: "2026-08-11T10:00:00.000Z",
    client_id: "client-1",
    provider_id: "provider-1",
    services: { name: "Bookkeeping" },
    providers: null,
    clients: null,
    request_assignments: [],
    request_events: [],
    request_schedules: null,
    ...overrides,
  }) as RequestRow;

const compute = (key: string, requests: RequestRow[]) =>
  operationsMetric(key).compute(requests, window);

describe("FTC", () => {
  it("counts a clean completion", () => {
    const result = compute("ftc", [
      request({
        request_events: [
          { to_status: "new", created_at: "2026-08-11T08:00:00.000Z" },
          { to_status: "completed", created_at: "2026-08-11T10:00:00.000Z" },
        ],
      }),
    ]);
    expect(result.display).toBe("100%");
  });

  it("does not count a request a partner rejected first", () => {
    const result = compute("ftc", [
      request({ request_assignments: [{ id: "a", status: "rejected" }] }),
    ]);
    expect(result.display).toBe("0%");
  });

  it("does not count a request whose status moved backwards", () => {
    const result = compute("ftc", [
      request({
        request_events: [
          { to_status: "in_progress", created_at: "2026-08-11T08:00:00.000Z" },
          { to_status: "open", created_at: "2026-08-11T09:00:00.000Z" },
          { to_status: "completed", created_at: "2026-08-11T10:00:00.000Z" },
        ],
      }),
    ]);
    expect(result.display).toBe("0%");
  });

  it("ignores completions from other weeks", () => {
    const result = compute("ftc", [
      request({ completed_at: "2026-07-01T10:00:00.000Z" }),
    ]);
    expect(result.display).toBeNull();
  });

  // The distinction that matters: nothing to measure is not the same as
  // measuring zero, and a tile that says 0% would read as a failed week.
  it("reports unknown rather than zero when the week held no completions", () => {
    const result = compute("ftc", []);
    expect(result.display).toBeNull();
    expect(result.basis).toMatch(/No qualifying requests/);
  });
});

describe("Total open SR", () => {
  it("counts every unfinished request regardless of week", () => {
    const result = compute("open", [
      request({ status: "open", completed_at: null }),
      request({ status: "in_progress", completed_at: null, created_at: "2025-01-01T00:00:00.000Z" }),
      request({ status: "completed" }),
      request({ status: "cancelled", completed_at: null }),
    ]);
    expect(result.display).toBe("2");
  });

  it("is a count, so zero open is a real answer", () => {
    expect(compute("open", []).display).toBe("0");
  });
});

describe("Completed on time", () => {
  it("measures against the due date", () => {
    const result = compute("on_time", [
      request({
        completed_at: "2026-08-11T10:00:00.000Z",
        request_schedules: { due_at: "2026-08-12T00:00:00.000Z", eta_type: "static" },
      }),
      request({
        completed_at: "2026-08-13T10:00:00.000Z",
        request_schedules: { due_at: "2026-08-12T00:00:00.000Z", eta_type: "static" },
      }),
    ]);
    expect(result.display).toBe("50%");
  });

  it("excludes completions with no due date rather than counting them late", () => {
    const result = compute("on_time", [request({ request_schedules: null })]);
    expect(result.display).toBeNull();
  });
});

describe("Accepted first time", () => {
  it("counts routing that needed no second offer", () => {
    const result = compute("accepted_first_offer", [
      request({ request_assignments: [{ id: "a", status: "accepted" }] }),
      request({ request_assignments: [{ id: "b", status: "rejected" }] }),
    ]);
    expect(result.display).toBe("50%");
  });

  it("ignores requests that were never routed", () => {
    expect(compute("accepted_first_offer", [request({ request_assignments: [] })]).display).toBeNull();
  });
});

describe("Open and overdue", () => {
  it("counts open requests past their due date", () => {
    const result = compute("overdue", [
      request({
        status: "open",
        completed_at: null,
        request_schedules: { due_at: "2020-01-01T00:00:00.000Z", eta_type: "static" },
      }),
      request({
        status: "open",
        completed_at: null,
        request_schedules: { due_at: "2099-01-01T00:00:00.000Z", eta_type: "static" },
      }),
    ]);
    expect(result.display).toBe("50%");
  });
});

describe("the registry", () => {
  it("marks which metrics are still provisional", () => {
    // Only Total open SR is fully defined; the brief left the rest unnamed.
    const settled = OPERATIONS_METRICS.filter((metric) => !metric.provisional).map((m) => m.key);
    expect(settled).toEqual(["open"]);
  });

  it("gives every metric a definition for the legend", () => {
    for (const metric of OPERATIONS_METRICS) {
      expect(metric.definition.length).toBeGreaterThan(20);
    }
  });

  it("falls back to the first metric for an unknown key", () => {
    expect(operationsMetric("nope").key).toBe("ftc");
  });

  it("builds a seven-day window from the fiscal calendar", () => {
    const current = currentWeekWindow(new Date("2026-08-11T10:00:00.000Z"));
    expect(current.quarter).toBe(2);
    expect(current.quarterWeek).toBe(11);
    expect((current.end.getTime() - current.start.getTime()) / 86_400_000).toBe(7);
  });
});
