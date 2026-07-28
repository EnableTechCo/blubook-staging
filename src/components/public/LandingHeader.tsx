"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CONTACT_SECTION_HREF } from "@/components/public/contact";
import { BrandMark } from "@/components/ui/BrandMark";

const navigation = [
  ["What we do", "#what-we-do"],
  ["How it works", "#how-it-works"],
  ["Arrangements", "#arrangements"],
  ["Why BluBook", "#why-blubook"],
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
    <header className="sticky top-0 z-40 flex min-h-16 items-center border-b border-ink/15 bg-paper-light/95 px-5 backdrop-blur-xl sm:px-8 lg:min-h-[72px] lg:px-[3vw]">
      <a href="#top" aria-label="BluBook home" className="shrink-0">
        <BrandMark compact />
      </a>

      <nav
        className="mx-auto hidden items-center gap-9 text-xs text-ink/65 lg:flex"
        aria-label="Main navigation"
      >
        {navigation.map(([label, href]) => (
          <a key={href} className="border-b border-transparent py-1 hover:border-cobalt hover:text-ink" href={href}>
            {label}
          </a>
        ))}
      </nav>

      <div className="ml-auto hidden items-center gap-6 sm:flex">
        <Link className="text-xs text-ink/70 hover:text-cobalt" href="/login">
          Sign in
        </Link>
        <a
          href={CONTACT_SECTION_HREF}
          className="inline-flex min-h-11 items-center border border-ink bg-ink px-5 text-xs font-semibold text-paper-light transition-colors hover:border-cobalt hover:bg-cobalt"
        >
          Begin a conversation
        </a>
      </div>

      <div className="relative ml-auto sm:ml-5 lg:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          aria-label={`${menuOpen ? "Close" : "Open"} navigation menu`}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="grid size-11 place-items-center text-ink"
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
            className="absolute right-0 top-[calc(100%+0.5rem)] grid w-[min(20rem,calc(100vw-2rem))] border border-ink bg-paper-light p-2 shadow-[10px_10px_0_rgba(38,34,29,0.10)]"
            aria-label="Mobile navigation"
          >
            {navigation.map(([label, href], index) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="grid min-h-12 grid-cols-[2rem_1fr] items-center border-b border-ink/15 px-2 text-sm last:border-b-0 hover:bg-cream/60"
              >
                <span className="font-mono text-[9px] text-cobalt" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex min-h-11 items-center justify-center border border-ink text-xs font-semibold"
            >
              Sign in
            </Link>
            <a
              href={CONTACT_SECTION_HREF}
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex min-h-11 items-center justify-center bg-ink px-4 text-xs font-semibold text-paper-light"
            >
              Begin a conversation
            </a>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
