"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavigationItem } from "@/components/layout/AppShell";
import { NavIcon } from "@/components/layout/NavIcon";

// Sections that used to expand in the sidebar now have landing pages of cards.
// That removes the two problems the dropdowns had: on the narrow rail a flyout
// opened over the content, and on mobile a section could be expanded while its
// own page was never reachable. One link per destination, and the sub-pages are
// cards on the page it opens.
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
        className="absolute left-0 top-[calc(100%+0.5rem)] grid w-[min(18rem,calc(100vw-2rem))] gap-1 border border-ink bg-paper-light p-2 shadow-xl"
        aria-label="Workspace"
      >
        {items.map((item) => {
          const active = routeIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`grid min-h-11 grid-cols-[1.75rem_1fr] items-center border px-2 text-xs font-medium ${
                active
                  ? "border-ink bg-cream text-ink"
                  : "border-transparent hover:border-ink/30 hover:bg-cream"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <NavIcon name={item.icon} className={active ? "size-[17px] text-cobalt" : "size-[17px] text-ink/55"} />
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
            className={`grid min-h-12 grid-cols-1 items-center justify-items-center border px-0 text-xs font-medium transition-colors xl:grid-cols-[1.75rem_1fr] xl:justify-items-start xl:px-2 ${
              active
                ? "border-paper-light bg-paper-light text-ink"
                : "border-transparent text-white/70 hover:border-white/15 hover:text-white"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {/* On the narrow rail the icon is the only thing shown, which is
                why every item has one rather than relying on the label. */}
            <NavIcon
              name={item.icon}
              className={`size-[18px] ${active ? "text-cobalt" : "text-white/60"}`}
            />
            <span className="hidden xl:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
