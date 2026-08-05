"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavigationItem } from "@/components/layout/AppShell";

function routeIsActive(pathname: string, href: string): boolean {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function childRouteIsActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/transact") {
    return pathname === href || pathname.startsWith("/dashboard/transact/service-request");
  }
  return routeIsActive(pathname, href);
}

function itemIsActive(pathname: string, item: NavigationItem): boolean {
  if (item.href && routeIsActive(pathname, item.href)) return true;
  return item.children?.some((child) => childRouteIsActive(pathname, child.href)) ?? false;
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
        {items.map((item, index) => {
          const active = itemIsActive(pathname, item);
          const number = String(index + 1).padStart(2, "0");

          return item.children ? (
            <details key={item.label} className="group" open={active || undefined}>
              <summary
                className={`grid min-h-11 cursor-pointer list-none grid-cols-[2rem_1fr_auto] items-center border px-2 text-xs font-medium [&::-webkit-details-marker]:hidden ${
                  active
                    ? "border-ink bg-cream text-ink"
                    : "border-transparent hover:border-ink/30 hover:bg-cream"
                }`}
              >
                <span className="font-mono text-[9px] text-cobalt" aria-hidden="true">
                  {number}
                </span>
                <span>{item.label}</span>
                <span className="text-[10px] transition-transform group-open:rotate-180" aria-hidden="true">
                  v
                </span>
              </summary>
              <div className="ml-4 grid border-l border-ink/35 py-1 pl-2">
                {item.children.map((child) => {
                  const childActive = childRouteIsActive(pathname, child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`border px-3 py-2.5 text-[11px] font-medium ${
                        childActive
                          ? "border-ink bg-paper text-ink"
                          : "border-transparent text-ink/65 hover:border-ink/30 hover:text-ink"
                      }`}
                      aria-current={childActive ? "page" : undefined}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            </details>
          ) : item.href ? (
            <Link
              key={item.href}
              href={item.href}
              className={`grid min-h-11 grid-cols-[2rem_1fr] items-center border px-2 text-xs font-medium ${
                active
                  ? "border-ink bg-cream text-ink"
                  : "border-transparent hover:border-ink/30 hover:bg-cream"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="font-mono text-[9px] text-cobalt" aria-hidden="true">
                {number}
              </span>
              <span>{item.label}</span>
            </Link>
          ) : null;
        })}
      </nav>
    );
  }

  return (
    <nav
      className="grid min-h-0 content-start gap-1 overflow-y-auto overscroll-contain px-3 py-2 [scrollbar-gutter:stable]"
      aria-label="Workspace"
    >
      {items.map((item, index) => {
        const active = itemIsActive(pathname, item);
        const number = String(index + 1).padStart(2, "0");

        return item.children ? (
          <details
            key={item.label}
            className="group relative"
            open={active || undefined}
          >
            <summary
              aria-label={item.label}
              title={item.label}
              className={`grid min-h-12 cursor-pointer list-none grid-cols-1 items-center justify-items-center border px-0 text-xs font-medium transition-colors xl:grid-cols-[2rem_1fr_auto] xl:justify-items-start xl:px-2 [&::-webkit-details-marker]:hidden ${
                active
                  ? "border-paper-light bg-paper-light text-ink"
                  : "border-transparent text-white/70 hover:border-white/15 hover:text-white"
              }`}
            >
              <span
                className={`font-mono text-[9px] ${active ? "text-rust" : "text-white/40"}`}
                aria-hidden="true"
              >
                {number}
              </span>
              <span className="hidden xl:inline">{item.label}</span>
              <span
                className="hidden text-[9px] transition-transform group-open:rotate-180 xl:inline"
                aria-hidden="true"
              >
                v
              </span>
            </summary>
            <div className="absolute left-[calc(100%+0.5rem)] top-0 z-40 grid w-56 border border-white/35 bg-ink-deep p-1 shadow-2xl xl:static xl:ml-8 xl:mt-1 xl:w-auto xl:border-l xl:border-r-0 xl:border-y-0 xl:bg-transparent xl:p-0 xl:pl-2 xl:shadow-none">
              {item.children.map((child) => {
                const childActive = childRouteIsActive(pathname, child.href);
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    aria-label={child.label}
                    title={child.label}
                    className={`border px-3 py-2.5 text-[10px] font-medium transition-colors ${
                      childActive
                        ? "border-paper-light bg-paper-light text-ink"
                        : "border-transparent text-white/65 hover:border-white/25 hover:text-white"
                    }`}
                    aria-current={childActive ? "page" : undefined}
                  >
                    {child.label}
                  </Link>
                );
              })}
            </div>
          </details>
        ) : item.href ? (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            className={`grid min-h-12 grid-cols-1 items-center justify-items-center border px-0 text-xs font-medium transition-colors xl:grid-cols-[2rem_1fr] xl:justify-items-start xl:px-2 ${
              active
                ? "border-paper-light bg-paper-light text-ink"
                : "border-transparent text-white/70 hover:border-white/15 hover:text-white"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span
              className={`font-mono text-[9px] ${
                active ? "text-rust" : "text-white/40"
              }`}
              aria-hidden="true"
            >
              {number}
            </span>
            <span className="hidden xl:inline">{item.label}</span>
          </Link>
        ) : null;
      })}
    </nav>
  );
}
