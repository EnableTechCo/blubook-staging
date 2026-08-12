import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  STAFF_DESTINATIONS,
  rolesForRoute,
  staffDestinationsFor,
  type StaffRoute,
} from "@/services/capabilities";

const labels = (staffRole: Parameters<typeof staffDestinationsFor>[0]) =>
  staffDestinationsFor(staffRole).map((destination) => destination.label);

describe("staff destinations", () => {
  it("shows an administrator everything", () => {
    expect(labels("admin")).toEqual(STAFF_DESTINATIONS.map((d) => d.label));
  });

  it("gives operations the delivery surfaces and not the commercial one", () => {
    expect(labels("operations")).toEqual([
      "Customers",
      "Onboardings",
      "Onboard a client",
      "Default documents",
      "Work groups",
    ]);
  });

  it("gives sales admin the catalogue and the onboarding queue to watch", () => {
    expect(labels("sales_admin")).toEqual(["Customers", "Onboardings", "Service catalogue"]);
  });

  it("leaves a sales rep and marketing with only what no tranche has narrowed", () => {
    expect(labels("sales_rep")).toEqual(["Customers"]);
    expect(labels("marketing")).toEqual(["Customers"]);
  });

  // A staff account with no role set should not fall through to everything.
  it("treats a missing role as the least privileged, not the most", () => {
    expect(labels(null)).toEqual(["Customers"]);
  });

  it("keeps the two administrator-only surfaces to administrators", () => {
    for (const route of [
      "/dashboard/partner-tiers",
      "/dashboard/compliance",
      "/dashboard/staff-roles",
    ] as const) {
      expect(rolesForRoute(route)).toEqual(["admin"]);
      for (const role of ["operations", "sales_admin", "sales_rep", "marketing"] as const) {
        expect(staffDestinationsFor(role).some((d) => d.href === route)).toBe(false);
      }
    }
  });
});

// The table only prevents drift if it is the thing both readers actually read.
// These two checks are what stop a route being added to one and not the other.
describe("the table and the pages agree", () => {
  const pageFor = (href: StaffRoute) =>
    join(process.cwd(), "src/app", href.replace("/dashboard", "dashboard"), "page.tsx");

  it("points every destination at a page that exists", () => {
    for (const destination of STAFF_DESTINATIONS) {
      expect(existsSync(pageFor(destination.href)), destination.href).toBe(true);
    }
  });

  it("guards every restricted destination with its own entry", () => {
    for (const destination of STAFF_DESTINATIONS) {
      if (destination.roles === null) continue;
      const source = readFileSync(pageFor(destination.href), "utf8");
      expect(source, `${destination.href} is restricted but does not guard itself`).toContain(
        `requireStaffRoute("${destination.href}")`,
      );
    }
  });
});
