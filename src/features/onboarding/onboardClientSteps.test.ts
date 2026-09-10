import { describe, expect, it } from "vitest";
import { makeSupabaseFake } from "../../../tests/stubs/supabaseFake";
import {
  buildComplianceChecklist,
  parseOnboardingForm,
  resolvePackageAssembly,
  rollbackOnboarding,
  snapshotAndRouteLineItems,
  type Admin,
  type Snapshot,
} from "@/features/onboarding/onboardClientSteps";

// Each step takes the admin client as a parameter, so the fake goes straight
// in — no module mocking. What these assert is the decision logic that was
// buried in a 397-line function: which branch, which rows, which order.

const admin = (fake: ReturnType<typeof makeSupabaseFake>) => fake.client as unknown as Admin;

const li = (id: string, over: Partial<{ price: number; fulfilment_mode: "service_request" | "automatic" }> = {}) => ({
  id, name: `Item ${id}`, tier: "basic" as const, price: 100, service_id: `svc-${id}`,
  fulfilment_mode: "service_request" as const, ...over,
});

describe("parseOnboardingForm", () => {
  it("refuses a package selection that is not JSON before touching the schema", () => {
    const fd = new FormData();
    fd.set("lineItemIds", "{not json");
    expect(parseOnboardingForm(fd)).toEqual({ error: "Invalid package selection." });
  });

  it("surfaces the first schema message for an incomplete form", () => {
    const out = parseOnboardingForm(new FormData());
    expect("error" in out).toBe(true);
    expect((out as { error: string }).error).not.toBe("Invalid package selection.");
  });
});

describe("resolvePackageAssembly", () => {
  it("throws when the selected package does not exist", async () => {
    const fake = makeSupabaseFake({ packages: [{ data: null, error: { message: "0 rows" } }] });
    await expect(
      resolvePackageAssembly(admin(fake), { packageMode: "standard", packageId: "pkg-x", lineItemIds: [] }),
    ).rejects.toThrow("Selected package not found");
  });

  it("standard: snapshots the bundle at the package price and term, skipping dangling items", async () => {
    const fake = makeSupabaseFake({
      packages: [{ data: { id: "pkg-1", name: "Starter", tier: "basic", price: 1500, billing_interval: "monthly" } }],
      package_line_items: [{ data: [
        { quantity: 2, line_items: li("a") },
        { quantity: 1, line_items: null },          // a deleted line item still referenced
        { quantity: 1, line_items: li("b", { fulfilment_mode: "automatic" }) },
      ] }],
    });

    const out = await resolvePackageAssembly(admin(fake), { packageMode: "standard", packageId: "pkg-1", lineItemIds: [] });

    expect(out.meta).toEqual({ type: "standard", tier: "basic", name: "Starter", total_price: 1500, billing_interval: "monthly" });
    expect(out.snapshots.map((s) => [s.source_line_item_id, s.quantity])).toEqual([["a", 2], ["b", 1]]);
    expect(fake.from).not.toHaveBeenCalledWith("line_items");
  });

  it("flex: prices each selected item once, totals them, and carries no term", async () => {
    const fake = makeSupabaseFake({
      packages: [{ data: { id: "pkg-1", name: "Starter", tier: "basic", price: 1500, billing_interval: "monthly" } }],
      line_items: [{ data: [li("a", { price: 250 }), li("b", { price: 75.5 })] }],
    });

    const out = await resolvePackageAssembly(admin(fake), { packageMode: "flex", packageId: "pkg-1", lineItemIds: ["a", "b"] });

    expect(out.meta).toEqual({ type: "flex", tier: null, name: "Starter (Flex)", total_price: 325.5, billing_interval: null });
    expect(out.snapshots.every((s) => s.quantity === 1)).toBe(true);
    expect(fake.argsOf("line_items", "in")).toEqual([["id", ["a", "b"]]]);
    expect(fake.from).not.toHaveBeenCalledWith("package_line_items");
  });

  it("flex: refuses an empty selection rather than assembling a free package", async () => {
    const fake = makeSupabaseFake({
      packages: [{ data: { id: "pkg-1", name: "Starter", tier: "basic", price: 1500, billing_interval: "monthly" } }],
      line_items: [{ data: [] }],
    });
    await expect(
      resolvePackageAssembly(admin(fake), { packageMode: "flex", packageId: "pkg-1", lineItemIds: ["gone"] }),
    ).rejects.toThrow("No line items selected");
  });
});

describe("buildComplianceChecklist", () => {
  it("creates one checklist row per active document type and names each from its type", async () => {
    const fake = makeSupabaseFake({
      compliance_document_types: [{ data: [{ id: "t1", name: "Tax clearance" }, { id: "t2", name: "CIPC certificate" }] }],
      onboarding_documents: [{ data: [{ id: "d1", document_type_id: "t1" }, { id: "d2", document_type_id: "t2" }] }],
    });

    const items = await buildComplianceChecklist(admin(fake), "onb-1");

    expect(items).toEqual([{ id: "d1", name: "Tax clearance" }, { id: "d2", name: "CIPC certificate" }]);
    expect(fake.argsOf("onboarding_documents", "insert")[0][0]).toEqual([
      { onboarding_id: "onb-1", document_type_id: "t1" },
      { onboarding_id: "onb-1", document_type_id: "t2" },
    ]);
  });

  it("returns empty and inserts nothing when no document types are active", async () => {
    const fake = makeSupabaseFake({ compliance_document_types: [{ data: [] }] });
    expect(await buildComplianceChecklist(admin(fake), "onb-1")).toEqual([]);
    expect(fake.from).not.toHaveBeenCalledWith("onboarding_documents");
  });
});

describe("snapshotAndRouteLineItems", () => {
  const snapshots: Snapshot[] = [
    { source_line_item_id: "a", name: "Bookkeeping", tier: "basic", unit_price: 100, quantity: 1, service_id: "svc-a", fulfilment_mode: "service_request" },
    { source_line_item_id: "b", name: "Portal access", tier: "basic", unit_price: 0, quantity: 1, service_id: "svc-b", fulfilment_mode: "automatic" },
  ];

  it("snapshots every item but raises and routes a request only where a partner must act", async () => {
    const fake = makeSupabaseFake({
      client_package_line_items: [{ data: { id: "snap-a" } }, { data: { id: "snap-b" } }],
      service_requests: [{ data: { id: "req-a" } }],
    });

    await snapshotAndRouteLineItems(admin(fake), { clientId: "cli-1", clientPackageId: "cp-1", snapshots });

    expect(fake.argsOf("client_package_line_items", "insert")).toHaveLength(2);
    expect(fake.argsOf("service_requests", "insert")).toHaveLength(1);
    expect(fake.argsOf("service_requests", "insert")[0][0]).toMatchObject({
      origin: "system", client_id: "cli-1", service_id: "svc-a", source_line_item_id: "snap-a", title: "Bookkeeping",
    });
    expect(fake.rpc).toHaveBeenCalledTimes(1);
    expect(fake.rpc).toHaveBeenCalledWith("route_request", { p_request_id: "req-a" });
  });

  it("stops at the first failed snapshot so the orchestrator can roll back", async () => {
    const fake = makeSupabaseFake({
      client_package_line_items: [{ data: null, error: { message: "duplicate key" } }],
    });
    await expect(
      snapshotAndRouteLineItems(admin(fake), { clientId: "cli-1", clientPackageId: "cp-1", snapshots }),
    ).rejects.toThrow("duplicate key");
    expect(fake.from).not.toHaveBeenCalledWith("service_requests");
  });
});

describe("rollbackOnboarding", () => {
  it("removes every uploaded object from its own bucket, then the client row, then the login", async () => {
    const fake = makeSupabaseFake({ clients: [{ data: null }] });

    await rollbackOnboarding(admin(fake), {
      userId: "user-9",
      clientId: "cli-9",
      uploaded: [{ bucket: "artwork", path: "cli-9/logo.png" }, { bucket: "documents", path: "cli-9/po.pdf" }],
    });

    expect(fake.removed).toEqual([
      { bucket: "artwork", paths: ["cli-9/logo.png"] },
      { bucket: "documents", paths: ["cli-9/po.pdf"] },
    ]);
    expect(fake.argsOf("clients", "delete")).toHaveLength(1);
    expect(fake.argsOf("clients", "eq")).toEqual([["id", "cli-9"]]);
    expect(fake.auth.admin.deleteUser).toHaveBeenCalledWith("user-9");
  });

  it("skips the client delete when the failure happened before the client row existed", async () => {
    const fake = makeSupabaseFake();
    await rollbackOnboarding(admin(fake), { userId: "user-9", clientId: null, uploaded: [] });

    expect(fake.from).not.toHaveBeenCalledWith("clients");
    expect(fake.removed).toEqual([]);
    expect(fake.auth.admin.deleteUser).toHaveBeenCalledWith("user-9");
  });
});
