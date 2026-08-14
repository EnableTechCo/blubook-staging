"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CONTACT_SECTION_HREF } from "@/components/public/contact";
import { BrandMark } from "@/components/ui/BrandMark";

const navigation = [
  ["Why BluBook", "#why-blubook"],
  ["What we do", "#what-we-do"],
  ["How it works", "#how-it-works"],
  ["Arrangements", "#arrangements"],
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
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="public-glass mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-white/80 bg-paper-light/80 px-4 py-3 shadow-glass sm:px-5 lg:grid-cols-[auto_1fr_auto]">
        <a href="#top" aria-label="BluBook home" className="rounded-lg">
          <BrandMark compact priority />
        </a>

        <nav className="hidden justify-center gap-1 lg:flex" aria-label="Main navigation">
          {navigation.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-[12px] font-medium text-ink/60 transition-colors hover:bg-cobalt-wash hover:text-cobalt"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="rounded-xl px-3 py-2 text-[12px] font-semibold text-ink/60 transition-colors hover:bg-cobalt-wash hover:text-cobalt"
          >
            Sign in
          </Link>
          <a
            href={CONTACT_SECTION_HREF}
            className="rounded-xl border border-cobalt bg-cobalt px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(45,93,180,0.16)] transition-colors hover:border-cobalt-deep hover:bg-cobalt-deep"
          >
            Begin a conversation
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
            className="grid size-10 place-items-center rounded-xl border border-ink/10 bg-paper-light text-ink shadow-sm"
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
              className="public-menu public-glass absolute right-0 top-[calc(100%+1rem)] grid w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/80 bg-paper-light/90 p-3 shadow-glass"
            >
              {navigation.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-11 items-center rounded-xl px-3 text-sm text-ink/70 transition-colors hover:bg-cobalt-wash hover:text-cobalt"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-ink/10 bg-paper-light text-xs font-semibold shadow-sm"
              >
                Sign in
              </Link>
              <a
                href={CONTACT_SECTION_HREF}
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex min-h-11 items-center justify-center rounded-xl border border-cobalt bg-cobalt px-4 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(45,93,180,0.16)]"
              >
                Begin a conversation
              </a>
            </nav>
          ) : null}
        </div>
      </div>
    </header>
  );
}
