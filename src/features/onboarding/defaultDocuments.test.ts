import { describe, expect, it, vi } from "vitest";
import { workGroupsForServices } from "@/features/onboarding/defaultDocuments";

// Minimal stub of the one query the function makes.
function adminReturning(rows: { group_id: string | null }[], spy?: (ids: string[]) => void) {
  return {
    from: () => ({
      select: () => ({
        in: (_column: string, ids: string[]) => {
          spy?.(ids);
          return Promise.resolve({ data: rows, error: null });
        },
      }),
    }),
  } as never;
}

// Which groups a client "has" is derived from their package's services, so a
// service moving between groups changes future deliveries without a backfill.
describe("workGroupsForServices", () => {
  it("returns the groups behind the package's services", async () => {
    const groups = await workGroupsForServices(
      adminReturning([{ group_id: "finance" }, { group_id: "hr" }]),
      ["svc-1", "svc-2"],
    );
    expect(groups.sort()).toEqual(["finance", "hr"]);
  });

  it("collapses duplicates, so two services in one group count once", async () => {
    const groups = await workGroupsForServices(
      adminReturning([{ group_id: "finance" }, { group_id: "finance" }]),
      ["svc-1", "svc-2"],
    );
    expect(groups).toEqual(["finance"]);
  });

  it("ignores services that belong to no work group", async () => {
    const groups = await workGroupsForServices(
      adminReturning([{ group_id: null }, { group_id: "finance" }]),
      ["svc-1", "svc-2"],
    );
    expect(groups).toEqual(["finance"]);
  });

  it("de-duplicates the service ids it queries with", async () => {
    const seen = vi.fn();
    await workGroupsForServices(adminReturning([], seen), ["svc-1", "svc-1", "svc-2"]);
    expect(seen).toHaveBeenCalledWith(["svc-1", "svc-2"]);
  });

  it("does not query at all for a package with no services", async () => {
    const seen = vi.fn();
    expect(await workGroupsForServices(adminReturning([], seen), [])).toEqual([]);
    expect(seen).not.toHaveBeenCalled();
  });
});
