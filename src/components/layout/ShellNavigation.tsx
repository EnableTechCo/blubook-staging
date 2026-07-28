"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

export function ShellNavigation({
  items,
  desktop = false,
}: {
  items: { href: Route; label: string }[];
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
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
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
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="grid content-start gap-1 px-3 py-2" aria-label="Workspace">
      {items.map((item, index) => {
        const active =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
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
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="hidden xl:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
