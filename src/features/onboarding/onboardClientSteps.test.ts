import { describe, expect, it } from "vitest";
import { makeSupabaseFake } from "../../../tests/stubs/supabaseFake";
import {
  complianceChecklistFor,
  notifyApprovers,
  parseOnboardingForm,
  recordWorkGroupIntake,
  resolvePackageAssembly,
  rollbackOnboarding,
  workGroupsForServices,
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
    // Ids arrive from the browser: a retired item posted by hand is not priced.
    expect(fake.argsOf("line_items", "eq")).toContainEqual(["active", true]);
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

describe("resolvePackageAssembly — active records only", () => {
  it("looks the package up among active packages, so a retired one is refused", async () => {
    const fake = makeSupabaseFake({ packages: [{ data: null, error: { message: "0 rows" } }] });
    await expect(
      resolvePackageAssembly(admin(fake), { packageMode: "standard", packageId: "retired", lineItemIds: [] }),
    ).rejects.toThrow("Selected package not found");
    expect(fake.argsOf("packages", "eq")).toEqual([["id", "retired"], ["active", true]]);
  });
});

describe("complianceChecklistFor", () => {
  it("names each checklist row approval opened, in creation order", async () => {
    const fake = makeSupabaseFake({
      onboarding_documents: [{
        data: [
          { id: "d1", created_at: "2026-09-25T08:00:00Z", compliance_document_types: { name: "Tax clearance" } },
          { id: "d2", created_at: "2026-09-25T08:00:01Z", compliance_document_types: null },
        ],
      }],
    });

    expect(await complianceChecklistFor(admin(fake), "onb-1")).toEqual([
      { id: "d1", name: "Tax clearance" },
      { id: "d2", name: "Compliance document" },
    ]);
    expect(fake.argsOf("onboarding_documents", "eq")).toEqual([["onboarding_id", "onb-1"]]);
  });

  it("surfaces a read failure rather than sending an empty checklist", async () => {
    const fake = makeSupabaseFake({ onboarding_documents: [{ data: null, error: { message: "permission denied" } }] });
    await expect(complianceChecklistFor(admin(fake), "onb-1")).rejects.toThrow("permission denied");
  });
});

describe("notifyApprovers", () => {
  it("notifies every active approver, urgently, naming the business", async () => {
    const fake = makeSupabaseFake({
      profiles: [{ data: [{ id: "ops-1" }, { id: "admin-1" }] }],
      notifications: [{ data: null, error: null }],
    });

    expect(await notifyApprovers(admin(fake), "Ridge Foods")).toBe(2);
    expect(fake.argsOf("profiles", "in")).toEqual([["staff_role", ["operations", "sales_admin", "admin"]]]);
    const [rows] = fake.argsOf("notifications", "insert")[0] as [{ recipient_id: string; type: string; urgent: boolean; body: string }[]];
    expect(rows.map((row) => row.recipient_id)).toEqual(["ops-1", "admin-1"]);
    expect(rows.every((row) => row.type === "onboarding_review" && row.urgent)).toBe(true);
    expect(rows[0].body).toContain("Ridge Foods");
  });

  it("does nothing when there is nobody to notify", async () => {
    const fake = makeSupabaseFake({ profiles: [{ data: [] }] });
    expect(await notifyApprovers(admin(fake), "Ridge Foods")).toBe(0);
    expect(fake.from).not.toHaveBeenCalledWith("notifications");
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

describe("workGroupsForServices", () => {
  it("returns each group once, from the catalogue, ignoring services with none", async () => {
    const fake = makeSupabaseFake({
      services: [{
        data: [
          { id: "svc-1", service_groups: { id: "grp-fin", slug: "finance" } },
          { id: "svc-2", service_groups: { id: "grp-fin", slug: "finance" } },
          { id: "svc-3", service_groups: { id: "grp-ten", slug: "tender-services" } },
          { id: "svc-4", service_groups: null },
        ],
        error: null,
      }],
    });

    const groups = await workGroupsForServices(admin(fake), ["svc-1", "svc-2", "svc-3", "svc-4", "svc-1"]);

    expect(groups).toEqual([
      { id: "grp-fin", slug: "finance" },
      { id: "grp-ten", slug: "tender-services" },
    ]);
    expect(fake.argsOf("services", "in")).toEqual([["id", ["svc-1", "svc-2", "svc-3", "svc-4"]]]);
  });

  it("asks nothing when there are no services", async () => {
    const fake = makeSupabaseFake();
    expect(await workGroupsForServices(admin(fake), [])).toEqual([]);
    expect(fake.from).not.toHaveBeenCalled();
  });
});

describe("recordWorkGroupIntake", () => {
  const groups = [
    { id: "grp-fin", slug: "finance" },
    { id: "grp-ten", slug: "tender-services" },
  ];

  it("writes one document per applicable group that has answers, stamped with who captured it", async () => {
    const fake = makeSupabaseFake({ client_work_group_intake: [{ data: null, error: null }] });

    await recordWorkGroupIntake(admin(fake), {
      clientId: "cli-1",
      capturedBy: "staff-1",
      groups,
      answers: {
        finance: { accounting_system: "xero", bank: "FNB" },
        // Not an applicable group: never written, however it got onto the form.
        marketing: { website: "https://ridge.test" },
      },
    });

    expect(fake.argsOf("client_work_group_intake", "insert")).toEqual([[[
      {
        client_id: "cli-1",
        service_group_id: "grp-fin",
        answers: { accounting_system: "xero", bank: "FNB" },
        captured_by: "staff-1",
      },
    ]]]);
  });

  it("writes nothing when no applicable group has an answer", async () => {
    const fake = makeSupabaseFake();
    await recordWorkGroupIntake(admin(fake), { clientId: "cli-1", capturedBy: "staff-1", groups, answers: {} });
    expect(fake.from).not.toHaveBeenCalled();
  });

  it("surfaces the database's refusal", async () => {
    const fake = makeSupabaseFake({ client_work_group_intake: [{ data: null, error: { message: "answers must be an object" } }] });
    await expect(
      recordWorkGroupIntake(admin(fake), {
        clientId: "cli-1", capturedBy: "staff-1", groups, answers: { finance: { bank: "FNB" } },
      }),
    ).rejects.toThrow("answers must be an object");
  });
});
