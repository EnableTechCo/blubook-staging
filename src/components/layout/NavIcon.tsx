// Navigation icons, drawn inline rather than pulled from a library.
//
// There are fifteen of them at a single size and weight, so a dependency would
// cost more than it saves — and inlining keeps them on the same stroke as the
// notification bell already in the header.
//
// Each is keyed by what the destination is, not by what it looks like, so
// renaming a nav item does not silently leave it with the wrong picture.

export type NavIconName =
  | "dashboard"
  | "customers"
  | "onboardings"
  | "onboard"
  | "catalogue"
  | "documents"
  | "workGroups"
  | "compliance"
  | "sales"
  | "transact"
  | "reports"
  | "financials"
  | "archive"
  | "notifications"
  | "messages";

const PATHS: Record<NavIconName, React.ReactNode> = {
  // Four panes: the overview.
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </>
  ),
  // Two people.
  customers: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </>
  ),
  // A checklist.
  onboardings: (
    <>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="m9 14 2 2 4-4" />
    </>
  ),
  // A person being added.
  onboard: (
    <>
      <path d="M14 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="8" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </>
  ),
  // A list of offerings.
  catalogue: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </>
  ),
  // A single document.
  documents: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </>
  ),
  // A group of three.
  workGroups: (
    <>
      <circle cx="12" cy="6" r="3" />
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M12 9v3M9.5 14.5 7 15.5M14.5 14.5 17 15.5" />
    </>
  ),
  // A shield: rules being enforced.
  compliance: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  // A rising line.
  sales: (
    <>
      <path d="M3 3v18h18" />
      <path d="m7 15 4-5 3 3 5-7" />
    </>
  ),
  // Exchange: something sent, something returned.
  transact: (
    <>
      <path d="M7 4v13M4 14l3 3 3-3" />
      <path d="M17 20V7M14 10l3-3 3 3" />
    </>
  ),
  // A bar chart.
  reports: (
    <>
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" />
      <rect x="13" y="8" width="3" height="10" />
      <rect x="19" y="14" width="0.01" height="4" />
    </>
  ),
  // A banknote.
  financials: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  // A folder.
  archive: (
    <path d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2z" />
  ),
  // The same bell the header uses.
  notifications: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  // A speech bubble.
  messages: (
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  ),
};

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className ?? "size-[18px]"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}
