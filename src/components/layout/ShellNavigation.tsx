"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavigationItem } from "@/components/layout/AppShell";
import { NavIcon } from "@/components/layout/NavIcon";

// Sections that used to expand in the sidebar now have landing pages of cards.
// The redesigned desktop rail keeps those labels visible at every supported
// width, while mobile retains the disclosure menu. One link per destination,
// and the sub-pages are cards on the page it opens.
function routeIsActive(pathname: string, href: string): boolean {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function ShellNavigation({
  items,
  desktop = false,
  collapsed = false,
}: {
  items: NavigationItem[];
  desktop?: boolean;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  if (!desktop) {
    return (
      <nav
        className="absolute left-0 top-[calc(100%+0.5rem)] grid w-[min(18rem,calc(100vw-2rem))] gap-1 rounded-lg border border-cobalt-deep/15 bg-white/[0.98] p-2 shadow-glass"
        aria-label="Workspace"
      >
        {items.map((item) => {
          const active = routeIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`grid min-h-11 grid-cols-[1.75rem_1fr] items-center rounded-md border px-3 text-xs font-medium transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                active
                  ? "border-cobalt-deep/20 bg-cobalt-deep text-white"
                  : "border-transparent text-cobalt-deep/70 hover:border-cobalt/15 hover:bg-cobalt-wash/60 hover:text-cobalt-deep"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <NavIcon name={item.icon} className={active ? "size-[17px] text-white" : "size-[17px] text-cobalt-deep/70"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className="workspace-sidebar__navigation grid min-h-0 content-start gap-1 overflow-y-auto overscroll-contain px-3 py-2 [scrollbar-gutter:stable]"
      aria-label="Workspace"
    >
      {items.map((item) => {
        const active = routeIsActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            className={`workspace-sidebar__link relative grid min-h-11 items-center rounded-md border text-xs font-medium transition-[color,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              collapsed ? "grid-cols-1 justify-items-center px-2" : "grid-cols-[1.75rem_1fr] px-3"
            } ${
              active
                ? "border-[#74bdff]/20 bg-[#74bdff]/[0.12] text-white shadow-[inset_2px_0_0_#74bdff]"
                : "border-transparent text-white/66 hover:bg-white/[0.045] hover:text-white"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <NavIcon
              name={item.icon}
              className={`size-[18px] ${active ? "text-[#9bd1ff]" : "text-white/55"}`}
            />
            <span className="workspace-sidebar__link-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
