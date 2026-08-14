import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ShellNavigation } from "@/components/layout/ShellNavigation";
import type { NavIconName } from "@/components/layout/NavIcon";
import { BrandMark } from "@/components/ui/BrandMark";
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
  const displayName = profile.full_name ?? profile.email;

  return (
    <div className="app-workspace min-h-screen md:grid md:grid-cols-[15.5rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)]">
      <aside
        className="workspace-glass workspace-sidebar fixed bottom-3 left-3 top-3 z-30 hidden w-[14.5rem] grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-[1.5rem] border text-white md:grid xl:w-64"
        aria-label={`${role.account} navigation`}
      >
        <Link
          href="/"
          className="flex min-h-[82px] items-center gap-3 border-b border-white/12 px-5 transition-colors hover:bg-white/[0.04]"
          aria-label="BluBook public website"
        >
          <BrandMark inverse />
        </Link>

        <section
          className="mx-3 my-4 rounded-2xl border border-white/15 border-l-[3px] border-l-[#5aaeff] bg-white/[0.07] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_30px_rgba(0,0,0,0.12)]"
          aria-label="Current workspace"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#9bd1ff]">
            {role.descriptor}
          </span>
          <strong className="mt-2 block text-sm font-semibold text-white">
            {role.account}
          </strong>
          <span className="mt-1 block truncate text-[10px] text-white/60">
            {profile.email}
          </span>
        </section>

        <ShellNavigation items={navigation} desktop />

        <footer className="border-t border-white/12 px-5 py-4">
          <strong className="block truncate text-xs text-white">{displayName}</strong>
          <span className="mt-1 block text-[10px] text-white/55">{role.context}</span>
        </footer>
      </aside>

      <div className="min-w-0 md:col-start-2">
        <header className="workspace-glass sticky top-3 z-20 mx-3 mt-3 flex min-h-16 items-center gap-3 rounded-2xl border border-cobalt/12 bg-paper-light/90 px-3.5 shadow-surface md:min-h-[68px] md:px-5">
          <details className="relative md:hidden">
            <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-xl border border-cobalt bg-cobalt font-mono text-[10px] text-white shadow-[0_8px_18px_rgba(31,65,115,0.16)] [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <ShellNavigation items={navigation} />
          </details>

          <div className="min-w-0">
            <span className="block font-mono text-[8px] uppercase tracking-[0.1em] text-cobalt md:text-[9px]">
              {role.context}
            </span>
            <strong className="mt-1 block truncate font-heading text-sm font-medium md:text-base">
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
            className={`relative ml-auto grid size-11 place-items-center rounded-xl border shadow-sm transition-[color,background-color,border-color,transform] ${
              unreadNotifications > 0
                ? "border-clay bg-clay/10 text-clay hover:bg-clay hover:text-paper"
                : "border-ink/15 bg-paper-light text-ink hover:border-cobalt/30 hover:bg-cobalt-wash hover:text-cobalt"
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
              className="min-h-11 rounded-xl border border-ink/15 bg-paper-light px-4 text-[11px] font-semibold uppercase tracking-[0.06em] shadow-sm transition-[color,background-color,border-color,transform] hover:border-cobalt/30 hover:bg-cobalt-wash hover:text-cobalt"
            >
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden" aria-hidden="true">
                ↗
              </span>
            </button>
          </form>
        </header>

        <main className="min-h-[calc(100vh-5rem)] bg-transparent px-4 pb-10 pt-7 md:px-6 md:pb-12 md:pt-9 xl:px-10 xl:pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
