/**
 * Every dashboard path the application revalidates or links to by name.
 *
 * revalidatePath("/dashboard/documents") appeared as a string literal twelve
 * times across the actions. A typo in any one of them — a missing segment, a
 * stray trailing slash — would revalidate nothing and raise nothing, and the
 * page would simply show stale data until the next hard reload. A constant
 * cannot be misspelled without the type checker noticing.
 *
 * Kept as plain strings, not Next's `Route` type, because revalidatePath takes
 * a string and the typed-routes generator already guards the <Link> side.
 */
export const ROUTES = {
  root: "/",
  dashboard: "/dashboard",
  catalogue: "/dashboard/catalogue",
  compliance: "/dashboard/compliance",
  customers: "/dashboard/customers",
  defaultDocuments: "/dashboard/default-documents",
  documents: "/dashboard/documents",
  financials: "/dashboard/financials",
  messages: "/dashboard/messages",
  notifications: "/dashboard/notifications",
  onboardings: "/dashboard/onboardings",
  partnerTiers: "/dashboard/partner-tiers",
  reportsRequests: "/dashboard/reports/requests",
  salesBookings: "/dashboard/sales/bookings",
  salesPipeline: "/dashboard/sales/pipeline",
  salesProducts: "/dashboard/sales/products",
  salesTargets: "/dashboard/sales/targets",
  staffRoles: "/dashboard/staff-roles",
  signup: "/signup",
  transact: "/dashboard/transact",
  transactLetterhead: "/dashboard/transact/letterhead",
  transactQuotation: "/dashboard/transact/quotation",
  workGroups: "/dashboard/work-groups",
} as const;
