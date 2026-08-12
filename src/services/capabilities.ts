import type { Route } from "next";
import type { NavIconName } from "@/components/layout/NavIcon";
import type { StaffRole } from "@/services/staffRole";

/**
 * Every staff destination and the roles that may reach it.
 *
 * This exists because the same rule was being written twice — once in the nav
 * so a link is not shown, and once in the page so a typed URL is refused — and
 * two copies of a rule are one edit away from disagreeing. The nav renders this
 * list and the page guards look themselves up in it, so a destination cannot be
 * visible to somebody the page will bounce.
 *
 * `roles: null` means every staff role, not "unrestricted": these are the
 * surfaces no tranche has narrowed yet, and they are the list of what is left.
 * Admin passes everything without being named, matching has_staff_role() in the
 * database.
 *
 * The database is still what enforces this. Nothing here is a security
 * boundary — it decides what a person is shown, and the policies decide what
 * they can do. When the two disagree the policy wins, which is the right way
 * round; this list only makes the disagreement visible.
 */
export interface StaffDestination {
  href: Route;
  label: string;
  icon: NavIconName;
  roles: readonly StaffRole[] | null;
}

export const STAFF_DESTINATIONS = [
  { href: "/dashboard/customers", label: "Customers", icon: "customers", roles: null },
  {
    href: "/dashboard/onboardings",
    label: "Onboardings",
    icon: "onboardings",
    roles: ["operations", "sales_admin"],
  },
  { href: "/dashboard/onboard", label: "Onboard a client", icon: "onboard", roles: ["operations"] },
  {
    href: "/dashboard/catalogue",
    label: "Service catalogue",
    icon: "catalogue",
    roles: ["sales_admin"],
  },
  {
    href: "/dashboard/default-documents",
    label: "Default documents",
    icon: "documents",
    roles: ["operations"],
  },
  { href: "/dashboard/work-groups", label: "Work groups", icon: "workGroups", roles: ["operations"] },
  { href: "/dashboard/partner-tiers", label: "Partner tiers", icon: "workGroups", roles: ["admin"] },
  {
    href: "/dashboard/compliance",
    label: "Compliance settings",
    icon: "compliance",
    roles: ["admin"],
  },
] as const satisfies readonly StaffDestination[];

export type StaffRoute = (typeof STAFF_DESTINATIONS)[number]["href"];

/** The roles that may reach a destination, or null when every staff role may. */
export function rolesForRoute(href: StaffRoute): readonly StaffRole[] | null {
  return STAFF_DESTINATIONS.find((destination) => destination.href === href)?.roles ?? null;
}

/** The destinations to show a staff member, in nav order. */
export function staffDestinationsFor(
  staffRole: StaffRole | null,
): readonly StaffDestination[] {
  if (staffRole === "admin") return STAFF_DESTINATIONS;

  return STAFF_DESTINATIONS.filter((destination) => {
    // Widened deliberately: `as const` narrows each entry to its own literal
    // tuple, which makes includes() compare against `never`.
    const roles: readonly StaffRole[] | null = destination.roles;
    return roles === null || (staffRole !== null && roles.includes(staffRole));
  });
}
