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
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-paper/85 backdrop-blur">
      <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-5 md:grid-cols-[auto_1fr_auto]">
        <a href="#top" aria-label="BluBook home">
          <BrandMark compact />
        </a>

        <nav className="hidden justify-center gap-8 md:flex" aria-label="Main navigation">
          {navigation.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-[13px] text-ink/70 transition-colors hover:text-rust"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link href="/login" className="text-[13px] text-ink/70 hover:text-rust">
            Sign in
          </Link>
          <a
            href={CONTACT_SECTION_HREF}
            className="bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-opacity hover:opacity-90"
          >
            Begin a conversation
          </a>
        </div>

        <div className="relative md:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={`${menuOpen ? "Close" : "Open"} navigation menu`}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-9 place-items-center"
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
              className="absolute right-0 top-[calc(100%+1.25rem)] grid w-[min(20rem,calc(100vw-3rem))] border border-ink/15 bg-paper p-3"
            >
              {navigation.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-11 items-center border-b border-ink/15 text-sm last:border-b-0"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-3 flex min-h-11 items-center justify-center border border-ink text-xs font-medium"
              >
                Sign in
              </Link>
              <a
                href={CONTACT_SECTION_HREF}
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex min-h-11 items-center justify-center bg-ink px-4 text-xs font-medium text-paper"
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
