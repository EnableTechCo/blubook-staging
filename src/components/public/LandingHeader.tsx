"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CONTACT_SECTION_HREF } from "@/components/public/contact";
import { BrandMark } from "@/components/ui/BrandMark";

const navigation = [
  ["Why BluBook", "#why-blubook"],
  ["What we do", "#what-we-do"],
  ["How it works", "#how-it-works"],
  ["Insights", "#insights"],
] as const;

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  return (
    <header className="absolute inset-x-0 top-0 z-40 border-b border-white/20 text-white">
      <div className="mx-auto grid h-[74px] max-w-[1150px] grid-cols-[minmax(0,1fr)_auto] items-center gap-5 px-5 lg:grid-cols-[auto_1fr_auto] lg:px-7">
        <a href="#top" aria-label="BluBook home" className="w-fit rounded-sm">
          <span className="inline-flex">
            <BrandMark priority />
          </span>
        </a>

        <nav className="hidden justify-end gap-7 lg:flex" aria-label="Main navigation">
          {navigation.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="border-b border-transparent py-2 text-[13px] font-semibold text-white/82 transition-[color,border-color,transform] hover:border-white/55 hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 border-l border-white/25 pl-6 lg:flex">
          <Link
            href="/login"
            className="py-2 text-[13px] font-semibold text-white/82 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <a
            href={CONTACT_SECTION_HREF}
            className="public-action inline-flex items-center gap-2 py-2 text-[13px] font-semibold text-white"
          >
            Talk to us <span className="public-action-arrow" aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="relative lg:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={`${menuOpen ? "Close" : "Open"} navigation menu`}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-[41px] w-[45px] place-items-center rounded-lg border border-white/30 bg-white/10 text-white backdrop-blur-sm"
          >
            <span aria-hidden="true" className="relative block h-3.5 w-5">
              <span className={`absolute left-0 top-0 h-px w-5 bg-current transition-transform ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`absolute left-0 top-[7px] h-px w-5 bg-current transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-[14px] h-px w-5 bg-current transition-transform ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </span>
          </button>

          {menuOpen ? (
            <nav
              id="landing-mobile-navigation"
              aria-label="Mobile navigation"
              className="public-menu absolute right-0 top-[calc(100%+1rem)] grid w-[min(21rem,calc(100vw-2.5rem))] rounded-lg border border-ink/10 bg-white p-3 text-ink shadow-[0_24px_65px_rgba(14,39,78,0.2)]"
            >
              {navigation.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-12 items-center justify-between border-b border-ink/10 px-3 text-sm font-medium last:border-b-0 hover:text-cobalt"
                >
                  {label} <span aria-hidden="true">→</span>
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-11 items-center justify-center rounded-lg border border-ink/15 text-xs font-semibold"
                >
                  Sign in
                </Link>
                <a
                  href={CONTACT_SECTION_HREF}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-11 items-center justify-center rounded-lg bg-gradient-to-r from-cobalt-deep to-cobalt px-4 text-xs font-semibold text-white"
                >
                  Talk to us
                </a>
              </div>
            </nav>
          ) : null}
        </div>
      </div>
    </header>
  );
}
