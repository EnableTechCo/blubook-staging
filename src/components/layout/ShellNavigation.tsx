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
}: {
  items: NavigationItem[];
  desktop?: boolean;
}) {
  const pathname = usePathname();

  if (!desktop) {
    return (
      <nav
        className="workspace-glass absolute left-0 top-[calc(100%+0.625rem)] grid w-[min(18rem,calc(100vw-2rem))] gap-1 rounded-2xl border border-cobalt/15 bg-paper-light/95 p-2 shadow-glass"
        aria-label="Workspace"
      >
        {items.map((item) => {
          const active = routeIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`grid min-h-11 grid-cols-[1.75rem_1fr] items-center rounded-xl border px-3 text-xs font-medium transition-[color,background-color,border-color,box-shadow,transform] ${
                active
                  ? "border-cobalt/25 bg-cobalt text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_18px_-12px_rgba(31,65,115,0.4)]"
                  : "border-transparent text-cobalt-deep/70 hover:border-cobalt/12 hover:bg-cobalt-wash/60 hover:text-cobalt-deep"
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
      className="grid min-h-0 content-start gap-1 overflow-y-auto overscroll-contain px-3 py-2 [scrollbar-gutter:stable]"
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
            className={`relative grid min-h-11 grid-cols-[1.75rem_1fr] items-center rounded-xl border px-3 text-xs font-medium transition-[color,background-color,border-color,transform] ${
              active
                ? "border-white/16 bg-white/[0.1] text-white shadow-[inset_2px_0_0_#74bdff,inset_0_1px_0_rgba(255,255,255,0.1)]"
                : "border-transparent text-white/66 hover:border-white/10 hover:bg-white/[0.055] hover:text-white"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <NavIcon
              name={item.icon}
              className={`size-[18px] ${active ? "text-[#9bd1ff]" : "text-white/55"}`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
