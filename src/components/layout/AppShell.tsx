import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ShellNavigation } from "@/components/layout/ShellNavigation";
import { BrandMark } from "@/components/ui/BrandMark";
import { signOut } from "@/features/auth/actions";
import type { Profile } from "@/services/profiles";

type WorkspaceRole = Profile["user_type"];

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

function navigationFor(role: WorkspaceRole, unreadNotifications = 0) {
  const navigation: { href: Route; label: string }[] = [
    { href: "/dashboard", label: "Dashboard" },
  ];

  if (role === "staff") {
    navigation.push(
      { href: "/dashboard/onboardings", label: "Onboardings" },
      { href: "/dashboard/onboard", label: "Onboard a client" },
      { href: "/dashboard/catalogue", label: "Service catalogue" },
    );
  }

  // Transacting is client-initiated, so the entry point is client-only.
  if (role === "client") {
    navigation.push({ href: "/dashboard/transact", label: "Transact" });
  }

  if (role === "client" || role === "service_provider") {
    navigation.push(
      { href: "/dashboard/documents", label: "Document Archive" },
      {
        href: "/dashboard/notifications",
        label: unreadNotifications > 0 ? `Notifications (${unreadNotifications})` : "Notifications",
      },
    );
  }

  navigation.push({ href: "/dashboard/messages", label: "Messages" });

  return navigation;
}

export function AppShell({
  profile,
  children,
  unreadNotifications = 0,
}: {
  profile: Profile;
  children: ReactNode;
  unreadNotifications?: number;
}) {
  const role = ROLE_COPY[profile.user_type];
  const navigation = navigationFor(profile.user_type, unreadNotifications);
  const displayName = profile.full_name ?? profile.email;

  return (
    <div className="min-h-screen md:grid md:grid-cols-[5.5rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[5.5rem] grid-rows-[auto_auto_1fr_auto] border-r border-ink bg-ink-deep text-paper-light md:grid xl:w-64"
        aria-label={`${role.account} navigation`}
      >
        <Link
          href="/"
          className="flex min-h-[84px] items-center justify-center gap-3 border-b border-white/25 px-0 xl:justify-start xl:px-6"
          aria-label="BluBook public website"
        >
          <span className="xl:hidden">
            <BrandMark compact inverse />
          </span>
          <span className="hidden xl:block">
            <BrandMark inverse />
          </span>
        </Link>

        <section
          className="mx-[18px] my-6 hidden border border-white/25 border-l-[3px] border-l-sun px-3.5 py-4 xl:block"
          aria-label="Current workspace"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-sun-light">
            {role.descriptor}
          </span>
          <strong className="mt-2 block font-heading text-base font-medium">
            {role.account}
          </strong>
          <span className="mt-1 block truncate text-[10px] text-white/60">
            {profile.email}
          </span>
        </section>

        <ShellNavigation items={navigation} desktop />

        <footer className="hidden border-t border-white/25 px-[18px] py-4 xl:block">
          <strong className="block truncate text-xs">{displayName}</strong>
          <span className="mt-1 block text-[10px] text-white/55">{role.context}</span>
        </footer>
      </aside>

      <div className="min-w-0 md:col-start-2">
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-ink/40 bg-paper-light/95 px-4 backdrop-blur-xl md:min-h-[72px] md:px-7">
          <details className="relative md:hidden">
            <summary className="grid size-10 cursor-pointer list-none place-items-center border border-ink/40 font-mono text-[10px] [&::-webkit-details-marker]:hidden">
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

          <form action={signOut} className="ml-auto">
            <button
              type="submit"
              aria-label="Sign out"
              className="min-h-10 border border-ink/40 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-cream"
            >
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden" aria-hidden="true">
                ↗
              </span>
            </button>
          </form>
        </header>

        <main className="min-h-[calc(100vh-4rem)] bg-paper px-4 py-6 md:min-h-[calc(100vh-4.5rem)] md:px-6 md:py-9 xl:px-14 xl:pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
