import { describe, expect, it } from "vitest";
import type { RequestRow } from "@/services/dashboard";
import { summariseRequests } from "@/features/dashboard/RequestSummary";

const row = (overrides: Partial<RequestRow> = {}): RequestRow => ({
  id: crypto.randomUUID(),
  reference: "SYS-000001",
  title: "Monthly reconciliation",
  status: "open",
  origin: "system",
  request_type: "general",
  created_at: "2026-07-30T08:00:00.000Z",
  client_id: "00000000-0000-0000-0000-000000000002",
  provider_id: "00000000-0000-0000-0000-000000000001",
  services: { name: "Bookkeeping", service_groups: { name: "Finance Group" } },
  providers: { business_name: "Sterling Accounts" },
  clients: { business_name: "Private Client Name" },
  request_schedules: { due_at: "2026-08-06T08:00:00.000Z", eta_type: "static" },
  ...overrides,
});

const valueOf = (entries: { key: string; value: number }[], key: string) =>
  entries.find((entry) => entry.key === key)?.value;

describe("summariseRequests", () => {
  it("splits totals across the four merged request kinds", () => {
    const summary = summariseRequests([
      row({ origin: "system" }),
      row({ origin: "system" }),
      row({ origin: "client" }),
      // Provider-raised is still raised by hand, so it reads as direct.
      row({ origin: "provider" }),
      row({ origin: "client", request_type: "purchase_order" }),
      row({ origin: "client", request_type: "tender_submission" }),
    ]);

    expect(summary.total).toBe(6);
    expect(valueOf(summary.byKind, "system")).toBe(2);
    expect(valueOf(summary.byKind, "direct")).toBe(2);
    expect(valueOf(summary.byKind, "purchase_order")).toBe(1);
    expect(valueOf(summary.byKind, "tender_submission")).toBe(1);
    // The merged breakdown accounts for every request.
    expect(summary.byKind.reduce((sum, e) => sum + e.value, 0)).toBe(summary.total);
  });

  it("always renders all four kinds so the strip keeps its shape", () => {
    const summary = summariseRequests([row({ origin: "system" })]);
    expect(summary.byKind.map((entry) => entry.key)).toEqual([
      "system",
      "direct",
      "purchase_order",
      "tender_submission",
    ]);
    expect(valueOf(summary.byKind, "purchase_order")).toBe(0);
  });

  it("counts a purchase order as its own kind, not as direct", () => {
    const summary = summariseRequests([row({ origin: "client", request_type: "purchase_order" })]);
    expect(valueOf(summary.byKind, "purchase_order")).toBe(1);
    expect(valueOf(summary.byKind, "direct")).toBe(0);
  });

  it("counts each lifecycle state", () => {
    const summary = summariseRequests([
      row({ status: "open" }),
      row({ status: "open" }),
      row({ status: "assigned" }),
      row({ status: "in_progress" }),
      row({ status: "completed" }),
    ]);

    expect(valueOf(summary.byStatus, "open")).toBe(2);
    expect(valueOf(summary.byStatus, "assigned")).toBe(1);
    expect(valueOf(summary.byStatus, "in_progress")).toBe(1);
    expect(valueOf(summary.byStatus, "completed")).toBe(1);
  });

  it("always shows the core states even at zero, so the strip keeps its shape", () => {
    const summary = summariseRequests([row({ status: "open" })]);
    expect(summary.byStatus.map((entry) => entry.key)).toEqual([
      "open",
      "assigned",
      "in_progress",
      "completed",
    ]);
  });

  it("adds non-core states only when something is in them", () => {
    const summary = summariseRequests([row({ status: "cancelled" })]);
    expect(summary.byStatus.map((entry) => entry.key)).toContain("cancelled");
    expect(summary.byStatus.map((entry) => entry.key)).not.toContain("new");
    expect(valueOf(summary.byStatus, "cancelled")).toBe(1);
  });

  it("labels states readably", () => {
    const summary = summariseRequests([row({ status: "in_progress" })]);
    expect(summary.byStatus.find((entry) => entry.key === "in_progress")?.label).toBe("In Progress");
  });

  it("keeps the kind and status breakdowns reconciled to the same total", () => {
    const rows = [
      row({ origin: "system", status: "open" }),
      row({ origin: "client", status: "completed" }),
      row({ origin: "client", request_type: "purchase_order", status: "in_progress" }),
      row({ origin: "client", request_type: "tender_submission", status: "completed" }),
    ];
    const summary = summariseRequests(rows);

    const kindTotal = summary.byKind.reduce((sum, e) => sum + e.value, 0);
    const statusTotal = summary.byStatus.reduce((sum, e) => sum + e.value, 0);
    expect(kindTotal).toBe(summary.total);
    expect(statusTotal).toBe(summary.total);
  });

  it("handles an empty workspace", () => {
    const summary = summariseRequests([]);
    expect(summary.total).toBe(0);
    expect(summary.byKind.every((entry) => entry.value === 0)).toBe(true);
  });
});
