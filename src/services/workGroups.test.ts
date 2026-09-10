import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseFake, mockCreateClient } from "../../tests/stubs/supabaseFake";

const conversation = { id: "wc-1", subject: "VAT query", created_at: "2026-09-01", assigned_provider_id: null,
  service_groups: { name: "Capital" }, work_group_messages: [] };

describe("work group conversations", () => {
  beforeEach(() => vi.resetModules());

  it("lists conversations newest first, capped at 50", async () => {
    const fake = makeSupabaseFake({ work_group_conversations: [{ data: [conversation] }] });
    mockCreateClient(fake);
    const { getWorkGroupConversations } = await import("@/services/workGroups");

    expect(await getWorkGroupConversations()).toEqual([conversation]);
    expect(fake.argsOf("work_group_conversations", "order")).toEqual([["created_at", { ascending: false }]]);
    expect(fake.argsOf("work_group_conversations", "limit")).toEqual([[50]]);
  });

  it("fetches one conversation by id, or null when the caller may not see it", async () => {
    const fake = makeSupabaseFake({ work_group_conversations: [{ data: null }] });
    mockCreateClient(fake);
    const { getWorkGroupConversation } = await import("@/services/workGroups");

    expect(await getWorkGroupConversation("wc-9")).toBeNull();
    expect(fake.argsOf("work_group_conversations", "eq")).toEqual([["id", "wc-9"]]);
  });

  it("list and detail select the same columns, so the two views cannot drift", async () => {
    const fake = makeSupabaseFake({ work_group_conversations: [{ data: [] }, { data: null }] });
    mockCreateClient(fake);
    const { getWorkGroupConversations, getWorkGroupConversation } = await import("@/services/workGroups");

    await getWorkGroupConversations();
    await getWorkGroupConversation("x");
    const [listCols, detailCols] = fake.argsOf("work_group_conversations", "select").map((a) => a[0]);
    expect(listCols).toBe(detailCols);
  });
});

describe("getAddressableWorkGroups", () => {
  beforeEach(() => vi.resetModules());

  it("returns active groups by name — names only, never membership", async () => {
    const fake = makeSupabaseFake({ service_groups: [{ data: [{ id: "g1", name: "Capital" }] }] });
    mockCreateClient(fake);
    const { getAddressableWorkGroups } = await import("@/services/workGroups");

    expect(await getAddressableWorkGroups()).toEqual([{ id: "g1", name: "Capital" }]);
    expect(fake.argsOf("service_groups", "select")).toEqual([["id,name"]]);
    expect(fake.argsOf("service_groups", "eq")).toEqual([["active", true]]);
    expect(fake.argsOf("service_groups", "order")).toEqual([["name"]]);
  });
});
