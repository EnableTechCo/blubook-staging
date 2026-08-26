"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ShellNavigation } from "@/components/layout/ShellNavigation";
import type { NavigationItem } from "@/components/layout/AppShell";
import { BrandMark } from "@/components/ui/BrandMark";

export function WorkspaceShellClient({
  sidebar,
  navigation,
  children,
}: {
  sidebar: {
    ariaLabel: string;
    descriptor: string;
    account: string;
    email: string;
    displayName: string;
    context: string;
  };
  navigation: NavigationItem[];
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="app-workspace workspace-shell-frame min-h-screen"
      data-sidebar-collapsed={collapsed}
    >
      <aside
        className="workspace-sidebar fixed bottom-0 left-0 top-0 z-30 hidden grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden border-r text-white md:grid"
        aria-label={sidebar.ariaLabel}
      >
        <div className="relative border-b border-white/12">
          <Link
            href="/"
            className="workspace-sidebar__brand flex min-h-[68px] items-center gap-3 px-4 transition-colors hover:bg-white/[0.04]"
            aria-label="BluBook public website"
          >
            <BrandMark compact={collapsed} inverse />
          </Link>
          <button
            type="button"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((current) => !current)}
            className="workspace-sidebar__toggle absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-white/70 transition-[color,background-color,border-color] duration-150 hover:border-[#74bdff]/30 hover:bg-[#74bdff]/10 hover:text-white"
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="workspace-sidebar__toggle-icon size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12.5 5-5 5 5 5" />
            </svg>
          </button>
        </div>

        <section
          className="workspace-sidebar__context mx-3 my-2 border-y border-white/10 border-l-2 border-l-[#74bdff] py-3 pl-3 pr-2"
          aria-label="Current workspace"
        >
          <span className="workspace-sidebar__monogram" aria-hidden="true">
            {sidebar.account.slice(0, 1)}
          </span>
          <div className="workspace-sidebar__copy">
            <span className="font-body text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9bd1ff]">
              {sidebar.descriptor}
            </span>
            <strong className="mt-1.5 block text-sm font-semibold text-white">
              {sidebar.account}
            </strong>
            <span className="mt-1 block truncate text-[10px] text-white/60">
              {sidebar.email}
            </span>
          </div>
        </section>

        <ShellNavigation items={navigation} desktop collapsed={collapsed} />

        <footer className="workspace-sidebar__footer border-t border-white/12 px-4 py-3">
          <span className="workspace-sidebar__avatar" aria-hidden="true">
            {sidebar.displayName.slice(0, 1).toUpperCase()}
          </span>
          <div className="workspace-sidebar__copy">
            <strong className="block truncate text-xs text-white">{sidebar.displayName}</strong>
            <span className="mt-1 block text-[10px] text-white/55">{sidebar.context}</span>
          </div>
        </footer>
      </aside>

      <div className="min-w-0 md:col-start-2">{children}</div>
    </div>
  );
}
