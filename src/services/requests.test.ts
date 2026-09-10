import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseFake, mockCreateClient } from "../../tests/stubs/supabaseFake";

// The request read model is the hub of the old dashboard module: twelve files
// import RequestRow and nothing else. Its two pieces of logic are the RPC
// fallback for a linked opportunity the embed could not reach, and the
// client-reference merge that carries the anonymity rule.

const row = (over: Record<string, unknown> = {}) => ({
  id: "req-1",
  reference: "SR-0001",
  title: "Renew tax clearance",
  status: "open",
  origin: "client",
  client_id: "cli-1",
  provider_id: null,
  services: null,
  providers: null,
  clients: null,
  request_schedules: null,
  request_documents: [],
  sales_opportunity_id: null,
  sales_opportunities: null,
  created_at: "2026-09-01T00:00:00Z",
  ...over,
});

describe("getRequestDetail", () => {
  beforeEach(() => vi.resetModules());

  it("returns null when the caller cannot see the request", async () => {
    const fake = makeSupabaseFake({ service_requests: [{ data: null }] });
    mockCreateClient(fake);
    const { getRequestDetail } = await import("@/services/requests");

    expect(await getRequestDetail("req-1")).toBeNull();
    expect(fake.rpc).not.toHaveBeenCalled();
  });

  it("attaches the client reference and business name from client_references", async () => {
    const fake = makeSupabaseFake({
      service_requests: [{ data: row() }],
      client_references: [
        { data: [{ id: "cli-1", external_reference: "CUS-0042", business_name: "Riverside Cafe" }] },
      ],
    });
    mockCreateClient(fake);
    const { getRequestDetail } = await import("@/services/requests");

    const detail = await getRequestDetail("req-1");
    expect(detail).toMatchObject({
      id: "req-1",
      client_reference: "CUS-0042",
      client_business_name: "Riverside Cafe",
    });
    // Looked up by the row's client_id, never embedded through clients —
    // that embed returns null for exactly the role that needs it most.
    expect(fake.argsOf("client_references", "in")).toEqual([["id", ["cli-1"]]]);
  });

  it("withholds the business name when the view answers null", async () => {
    const fake = makeSupabaseFake({
      service_requests: [{ data: row() }],
      client_references: [{ data: [{ id: "cli-1", external_reference: "CUS-0042", business_name: null }] }],
    });
    mockCreateClient(fake);
    const { getRequestDetail } = await import("@/services/requests");

    const detail = await getRequestDetail("req-1");
    expect(detail?.client_reference).toBe("CUS-0042");
    expect(detail?.client_business_name).toBeNull();
  });

  it("falls back to the RPC when an opportunity is linked but the embed came back empty", async () => {
    const fake = makeSupabaseFake({
      service_requests: [{ data: row({ sales_opportunity_id: "opp-9", sales_opportunities: null }) }],
      client_references: [{ data: [] }],
    });
    fake.rpc.mockResolvedValueOnce({
      data: [{ deal_reference: "BLB-2026-000009", opportunity_name: "Q3 catering", revenue: 1200 }],
      error: null,
    });
    mockCreateClient(fake);
    const { getRequestDetail } = await import("@/services/requests");

    const detail = await getRequestDetail("req-1");
    expect(fake.rpc).toHaveBeenCalledWith("get_linked_opportunity_for_request", { p_request_id: "req-1" });
    expect(detail?.sales_opportunities).toMatchObject({ deal_reference: "BLB-2026-000009" });
  });

  it("does not call the RPC when the embed already resolved", async () => {
    const opp = { deal_reference: "BLB-1", opportunity_name: "x", revenue: 1 };
    const fake = makeSupabaseFake({
      service_requests: [{ data: row({ sales_opportunity_id: "opp-1", sales_opportunities: opp }) }],
      client_references: [{ data: [] }],
    });
    mockCreateClient(fake);
    const { getRequestDetail } = await import("@/services/requests");

    await getRequestDetail("req-1");
    expect(fake.rpc).not.toHaveBeenCalled();
  });
});
