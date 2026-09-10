import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseFake, mockCreateClient } from "../../tests/stubs/supabaseFake";

// Messaging carries the only non-trivial logic in the old module that is not
// about requests: which requests count as conversations, and how the inbox
// orders them. Both are easy to break silently in a move.

const msg = (id: string, at: string) => ({
  id, body: "…", sender_role: "client", sender_id: "p1", created_at: at,
});
const thread = (id: string, provider_id: string | null, messages: ReturnType<typeof msg>[]) => ({
  id, reference: `SR-${id}`, title: id, status: "open", provider_id, request_messages: messages,
});

describe("getThreadSummaries", () => {
  beforeEach(() => vi.resetModules());

  it("drops a request with no partner and no messages — there is nobody to talk to", async () => {
    const fake = makeSupabaseFake({
      service_requests: [{ data: [
        thread("a", null, []),                       // dropped
        thread("b", "prov-1", []),                   // kept: a counterpart exists
        thread("c", null, [msg("m1", "2026-09-01")]), // kept: BluBook already answered it
      ] }],
    });
    mockCreateClient(fake);
    const { getThreadSummaries } = await import("@/services/messaging");

    const ids = (await getThreadSummaries()).map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(["b", "c"]));
    expect(ids).not.toContain("a");
  });

  it("orders newest activity first and sinks silent threads to the bottom", async () => {
    const fake = makeSupabaseFake({
      service_requests: [{ data: [
        thread("quiet", "prov-1", []),
        thread("old", "prov-1", [msg("m1", "2026-08-01T10:00:00Z")]),
        thread("new", "prov-1", [msg("m2", "2026-09-01T10:00:00Z"), msg("m3", "2026-09-02T10:00:00Z")]),
      ] }],
    });
    mockCreateClient(fake);
    const { getThreadSummaries } = await import("@/services/messaging");

    const out = await getThreadSummaries();
    expect(out.map((t) => t.id)).toEqual(["new", "old", "quiet"]);
    expect(out[0]).toMatchObject({ messageCount: 2, lastMessage: { id: "m3" } });
    expect(out[2].lastMessage).toBeNull();
  });

  it("picks the latest message even when the rows arrive out of order", async () => {
    const fake = makeSupabaseFake({
      service_requests: [{ data: [
        thread("x", "prov-1", [msg("late", "2026-09-05"), msg("early", "2026-09-01")]),
      ] }],
    });
    mockCreateClient(fake);
    const { getThreadSummaries } = await import("@/services/messaging");

    expect((await getThreadSummaries())[0].lastMessage?.id).toBe("late");
  });
});

describe("getThread", () => {
  beforeEach(() => vi.resetModules());

  it("returns the conversation scoped to the request id", async () => {
    const fake = makeSupabaseFake({ service_requests: [{ data: thread("t1", "prov-1", []) }] });
    mockCreateClient(fake);
    const { getThread } = await import("@/services/messaging");

    expect(await getThread("t1")).toMatchObject({ id: "t1" });
    expect(fake.argsOf("service_requests", "eq")).toEqual([["id", "t1"]]);
  });
});
