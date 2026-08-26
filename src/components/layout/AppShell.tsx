import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ShellNavigation } from "@/components/layout/ShellNavigation";
import type { NavIconName } from "@/components/layout/NavIcon";
import { WorkspaceShellClient } from "@/components/layout/WorkspaceShellClient";
import { signOut } from "@/features/auth/actions";
import type { Profile } from "@/services/profiles";
import { staffDestinationsFor } from "@/services/capabilities";

type WorkspaceRole = Profile["user_type"];

// Every destination is a single link now. Sections that used to expand in the
// sidebar have landing pages of cards instead, which is the pattern the rest of
// the app already used for Transact and Reports.
export interface NavigationItem {
  href: Route;
  label: string;
  icon: NavIconName;
}

const ROLE_COPY: Record<
  WorkspaceRole,
  { account: string; context: string; descriptor: string }
> = {
  client: {
    account: "Client workspace",
    context: "Managed services",
    descriptor: "Your operating account",
  },
  service_provider: {
    account: "Provider workspace",
    context: "Assigned work",
    descriptor: "Your service practice",
  },
  staff: {
    account: "Operations",
    context: "BluBook network",
    descriptor: "Staff command",
  },
};

function navigationFor(
  role: WorkspaceRole,
  unreadNotifications = 0,
  canSubmitFinancials = false,
  staffRole: Profile["staff_role"] = null,
) {
  const navigation: NavigationItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  ];

  // Staff nav is rendered from the capability table, not restated here. The
  // page guards read the same entries, so a destination cannot be shown to
  // somebody the page will bounce.
  if (role === "staff") {
    navigation.push(...staffDestinationsFor(staffRole));
  }

  // Transacting is client-initiated: every submission form is client-only, and
  // the reporting views a partner used to reach from here now live in Reports.
  if (role === "client") {
    navigation.push(
      { href: "/dashboard/sales", label: "Sales", icon: "sales" },
      { href: "/dashboard/transact", label: "Transact", icon: "transact" },
    );
  }

  // Only partners carrying a client's financial reporting see this, so the
  // entry never leads somewhere with nothing to file.
  if (role === "service_provider" && canSubmitFinancials) {
    navigation.push({
      href: "/dashboard/financials",
      label: "Client Financials",
      icon: "financials",
    });
  }

  if (role === "client" || role === "service_provider") {
    navigation.push(
      { href: "/dashboard/reports", label: "Reports", icon: "reports" },
      { href: "/dashboard/documents", label: "Document Archive", icon: "archive" },
      {
        href: "/dashboard/notifications",
        label: unreadNotifications > 0 ? `Notifications (${unreadNotifications})` : "Notifications",
        icon: "notifications",
      },
    );
  }

  navigation.push({ href: "/dashboard/messages", label: "Messages", icon: "messages" });

  return navigation;
}

export function AppShell({
  profile,
  children,
  unreadNotifications = 0,
  canSubmitFinancials = false,
}: {
  profile: Profile;
  children: ReactNode;
  unreadNotifications?: number;
  canSubmitFinancials?: boolean;
}) {
  const role = ROLE_COPY[profile.user_type];
  const navigation = navigationFor(
    profile.user_type,
    unreadNotifications,
    canSubmitFinancials,
    profile.staff_role,
  );
  const displayName = profile.full_name ?? profile.email ?? "BluBook user";

  return (
    <WorkspaceShellClient
      sidebar={{
        ariaLabel: `${role.account} navigation`,
        descriptor: role.descriptor,
        account: role.account,
        email: profile.email ?? "No email recorded",
        displayName,
        context: role.context,
      }}
      navigation={navigation}
    >
        <header className="workspace-toolbar sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b px-4 md:min-h-[68px] md:px-6">
          <details className="relative md:hidden">
            <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-md border border-cobalt-deep bg-cobalt-deep font-body text-[10px] font-semibold uppercase tracking-[0.04em] text-white [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <ShellNavigation items={navigation} />
          </details>

          <div className="min-w-0 border-l-2 border-cobalt/45 pl-3">
            <span className="block font-body text-[9px] font-semibold uppercase tracking-[0.08em] text-cobalt-deep/65">
              {role.context}
            </span>
            <strong className="mt-0.5 block truncate font-body text-sm font-semibold text-cobalt-deep md:text-[15px]">
              {displayName}
            </strong>
          </div>

          <Link
            href="/dashboard/notifications"
            // The brief calls this Urgent and asks for a larger icon: it now
            // rings only for urgent notifications, so it has to be worth
            // looking at when it does.
            aria-label={
              unreadNotifications > 0
                ? `${unreadNotifications} urgent notification${unreadNotifications === 1 ? "" : "s"}`
                : "Urgent notifications"
            }
            title="Urgent"
            className={`relative ml-auto grid size-11 place-items-center rounded-md border bg-white transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              unreadNotifications > 0
                ? "border-clay/35 text-clay hover:border-clay hover:bg-clay hover:text-paper"
                : "border-cobalt-deep/15 text-cobalt-deep hover:border-cobalt/35 hover:bg-cobalt-wash/65"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-[22px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
            {unreadNotifications > 0 ? (
              <span className="absolute -right-2 -top-2 grid min-h-5 min-w-5 place-items-center rounded-full bg-clay px-1 font-mono text-[9px] font-semibold text-white">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            ) : null}
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              className="min-h-11 rounded-md border border-cobalt-deep/15 bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-cobalt-deep transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-cobalt/35 hover:bg-cobalt-wash/65"
            >
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden" aria-hidden="true">
                ↗
              </span>
            </button>
          </form>
        </header>

        <main className="min-h-[calc(100vh-5rem)] bg-transparent px-4 pb-10 pt-8 md:px-6 md:pb-12 md:pt-10 xl:px-10 xl:pb-16">
          {children}
        </main>
    </WorkspaceShellClient>
  );
}
