import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseFake, mockCreateClient } from "../../tests/stubs/supabaseFake";

describe("getUnreadNotificationCount", () => {
  beforeEach(() => vi.resetModules());

  it("counts only urgent, unread notifications — the bell is deliberately quiet", async () => {
    const fake = makeSupabaseFake({ notifications: [{ count: 3 }] });
    mockCreateClient(fake);
    const { getUnreadNotificationCount } = await import("@/services/notifications");

    expect(await getUnreadNotificationCount()).toBe(3);
    expect(fake.argsOf("notifications", "eq")).toEqual([["urgent", true]]);
    expect(fake.argsOf("notifications", "is")).toEqual([["read_at", null]]);
    // head:true — the count is asked for without pulling rows
    expect(fake.argsOf("notifications", "select")[0][1]).toMatchObject({ count: "exact", head: true });
  });

  it("reads a missing count as zero rather than undefined", async () => {
    const fake = makeSupabaseFake({ notifications: [{ count: null }] });
    mockCreateClient(fake);
    const { getUnreadNotificationCount } = await import("@/services/notifications");
    expect(await getUnreadNotificationCount()).toBe(0);
  });
});

describe("getNotifications", () => {
  beforeEach(() => vi.resetModules());

  it("returns the caller's notifications newest first, capped at 100", async () => {
    const rows = [{ id: "n1", urgent: true, title: "Overdue", read_at: null }];
    const fake = makeSupabaseFake({ notifications: [{ data: rows }] });
    mockCreateClient(fake);
    const { getNotifications } = await import("@/services/notifications");

    expect(await getNotifications()).toEqual(rows);
    expect(fake.argsOf("notifications", "order")).toEqual([["created_at", { ascending: false }]]);
    expect(fake.argsOf("notifications", "limit")).toEqual([[100]]);
  });

  it("returns an empty list, not null, when there are none", async () => {
    const fake = makeSupabaseFake({ notifications: [{ data: null }] });
    mockCreateClient(fake);
    const { getNotifications } = await import("@/services/notifications");
    expect(await getNotifications()).toEqual([]);
  });
});
