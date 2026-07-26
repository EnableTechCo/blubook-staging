"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CONTACT_SECTION_HREF } from "@/components/public/contact";

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
    <header className="sticky top-0 z-40 flex min-h-[72px] items-center border-b border-ink/25 bg-paper-light/95 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
      <a href="#top" className="flex items-center gap-3" aria-label="BluBook home">
        <Image
          src="/images/blubook-logo-mark.png"
          width={34}
          height={34}
          alt=""
          priority
        />
        <strong className="text-lg font-semibold tracking-[-0.04em]">blubook</strong>
      </a>

      <nav
        className="mx-auto hidden items-center gap-8 text-xs font-semibold lg:flex"
        aria-label="Main navigation"
      >
        {navigation.map(([label, href]) => (
          <a key={href} className="hover:text-cobalt" href={href}>
            {label}
          </a>
        ))}
      </nav>

      <div className="ml-auto hidden items-center gap-5 sm:flex">
        <Link className="text-xs font-semibold hover:text-cobalt" href="/login">
          Sign in
        </Link>
        <a
          href={CONTACT_SECTION_HREF}
          className="inline-flex min-h-11 items-center gap-3 bg-cobalt px-4 text-xs font-semibold text-white hover:bg-cobalt-deep"
        >
          Talk to us <span aria-hidden="true">↘</span>
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
          className="grid min-h-11 place-items-center border border-ink/40 px-3 font-mono text-[10px] uppercase tracking-[0.1em]"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
        {menuOpen ? (
          <nav
            id="landing-mobile-navigation"
            className="absolute right-0 top-[calc(100%+0.5rem)] grid w-[min(19rem,calc(100vw-2rem))] border border-ink bg-paper-light p-2 shadow-xl"
            aria-label="Mobile navigation"
          >
            {navigation.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-ink/15 px-3 py-3 text-sm font-semibold last:border-b-0"
              >
                {label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-2 bg-ink px-3 py-3 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
