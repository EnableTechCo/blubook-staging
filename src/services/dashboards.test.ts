import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseFake, mockCreateClient } from "../../tests/stubs/supabaseFake";

// The three per-role summaries. Each fans out in a Promise.all and then
// stitches results together; the stitching is where a move goes wrong.

const request = (id: string, client_id: string) => ({
  id, reference: `SR-${id}`, title: id, status: "open", origin: "client",
  client_id, provider_id: null, services: null, providers: null, clients: null,
  request_schedules: null, created_at: "2026-09-01",
});

describe("getProviderDashboard", () => {
  beforeEach(() => vi.resetModules());

  it("flattens work-group membership, drops nulls, and sorts by name", async () => {
    const fake = makeSupabaseFake({
      providers: [{ data: { id: "prov-1", status: "active", tier: "standard" } }],
      provider_capabilities: [{ data: [] }],
      work_group_members: [{ data: [
        { service_groups: { id: "g2", name: "Tender" } },
        { service_groups: null },
        { service_groups: { id: "g1", name: "Capital" } },
      ] }],
      service_requests: [{ data: [] }],
      request_assignments: [{ data: [] }],
    });
    mockCreateClient(fake);
    const { getProviderDashboard } = await import("@/services/dashboards");

    const out = await getProviderDashboard();
    expect(out.workGroups).toEqual([{ id: "g1", name: "Capital" }, { id: "g2", name: "Tender" }]);
    expect(out.provider).toMatchObject({ id: "prov-1" });
    // Only offers still open are shown
    expect(fake.argsOf("request_assignments", "eq")).toEqual([["status", "offered"]]);
  });

  it("attaches client references to the requests it lists", async () => {
    const fake = makeSupabaseFake({
      providers: [{ data: null }],
      provider_capabilities: [{ data: null }],
      work_group_members: [{ data: null }],
      service_requests: [{ data: [request("r1", "cli-A")] }],
      request_assignments: [{ data: null }],
      client_references: [{ data: [{ id: "cli-A", external_reference: "CUS-0007", business_name: null }] }],
    });
    mockCreateClient(fake);
    const { getProviderDashboard } = await import("@/services/dashboards");

    const out = await getProviderDashboard();
    expect(out.requests[0]).toMatchObject({ id: "r1", client_reference: "CUS-0007", client_business_name: null });
    expect(out.capabilities).toEqual([]);
    expect(out.offers).toEqual([]);
  });
});

describe("getClientDashboard", () => {
  beforeEach(() => vi.resetModules());

  it("returns the client, its packages and its requests with references attached", async () => {
    const fake = makeSupabaseFake({
      clients: [{ data: { id: "cli-1", business_name: "Riverside Cafe", status: "active", artwork_path: null } }],
      client_packages: [{ data: [{ id: "pk1", name: "Starter", type: "standard", tier: "basic",
        total_price: 100, status: "active", client_package_line_items: [] }] }],
      service_requests: [{ data: [request("r1", "cli-1")] }],
      client_references: [{ data: [{ id: "cli-1", external_reference: "CUS-0001", business_name: "Riverside Cafe" }] }],
    });
    mockCreateClient(fake);
    const { getClientDashboard } = await import("@/services/dashboards");

    const out = await getClientDashboard();
    expect(out.client?.business_name).toBe("Riverside Cafe");
    expect(out.packages).toHaveLength(1);
    expect(out.requests[0].client_reference).toBe("CUS-0001");
  });
});

describe("getStaffDashboard", () => {
  beforeEach(() => vi.resetModules());

  it("reads every count, defaulting a missing count to zero", async () => {
    const fake = makeSupabaseFake({
      // countOf: clients, providers, services — then the list reads of each
      clients: [{ count: 12 }, { data: [{ id: "c1", business_name: "A", status: "active" }] }],
      providers: [{ count: null }, { data: [] }],
      services: [{ count: 5 }, { data: [] }],
      // open, awaiting, then the recent 25
      service_requests: [{ count: 7 }, { count: 2 }, { data: [] }],
    });
    mockCreateClient(fake);
    const { getStaffDashboard } = await import("@/services/dashboards");

    const out = await getStaffDashboard();
    expect(out.counts).toEqual({ clients: 12, providers: 0, services: 5, openRequests: 7, awaitingAssignment: 2 });
    expect(out.clients).toHaveLength(1);
    // Open = not completed and not cancelled; awaiting = exactly that status
    expect(fake.argsOf("service_requests", "not")).toEqual([["status", "in", "(completed,cancelled)"]]);
    expect(fake.argsOf("service_requests", "eq")).toEqual([["status", "awaiting_assignment"]]);
    expect(fake.argsOf("service_requests", "limit")).toEqual([[25]]);
  });
});
