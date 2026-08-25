"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 24);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        className="public-landing-header fixed inset-x-0 top-0 z-50"
        data-scrolled={scrolled}
        data-menu-open={menuOpen}
      >
        <div className="public-header-shell mx-auto grid h-[68px] max-w-[1200px] grid-cols-[minmax(0,1fr)_auto] items-center gap-5 px-5 lg:grid-cols-[auto_1fr_auto] lg:px-7">
          <a href="#top" aria-label="BluBook home" className="public-header-logo w-fit rounded-sm">
            <BrandMark priority />
          </a>

          <nav className="hidden justify-center gap-9 lg:flex" aria-label="Main navigation">
            {navigation.map(([label, href]) => (
              <a key={href} href={href} className="public-header-link py-3 text-[12px] font-semibold">
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <Link href="/login" className="public-header-link py-3 text-[12px] font-semibold">
              Sign in
            </Link>
            <a
              href={CONTACT_SECTION_HREF}
              className="public-action public-header-cta inline-flex min-h-11 items-center gap-3 rounded-full px-5 py-2.5 text-[12px] font-semibold text-white"
            >
              Talk to us <span className="public-action-arrow" aria-hidden="true">↗</span>
            </a>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={`${menuOpen ? "Close" : "Open"} navigation menu`}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="public-menu-button relative grid size-11 place-items-center rounded-full lg:hidden"
          >
            <span aria-hidden="true" className="relative block h-[15px] w-5">
              <span className="public-menu-line public-menu-line--top absolute left-0 top-0 h-px w-5 bg-current" />
              <span className="public-menu-line public-menu-line--middle absolute left-0 top-[7px] h-px w-5 bg-current" />
              <span className="public-menu-line public-menu-line--bottom absolute left-0 top-[14px] h-px w-5 bg-current" />
            </span>
          </button>
        </div>
      </header>

      <button
        type="button"
        className="public-menu-backdrop fixed inset-0 z-[55] bg-[#020814]/68 lg:hidden"
        data-open={menuOpen}
        aria-label="Close navigation menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={closeMenu}
      />
      <aside
        id="landing-mobile-navigation"
        className="public-menu-drawer fixed inset-y-0 right-0 z-[60] flex w-[85%] max-w-[350px] flex-col border-l border-white/10 bg-[#061225]/94 px-6 pb-7 pt-6 text-white lg:hidden"
        data-open={menuOpen}
        aria-hidden={!menuOpen}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/48">Navigate BluBook</span>
          <button
            type="button"
            onClick={closeMenu}
            className="grid size-10 place-items-center rounded-full border border-white/14 text-xl text-white/78"
            aria-label="Close navigation menu"
            tabIndex={menuOpen ? 0 : -1}
          >
            ×
          </button>
        </div>

        <nav className="mt-9 grid" aria-label="Mobile navigation">
          {navigation.map(([label, href], index) => (
            <a
              key={href}
              href={href}
              onClick={closeMenu}
              tabIndex={menuOpen ? 0 : -1}
              className="public-menu-drawer__link flex min-h-14 items-center justify-between border-b border-white/10 font-heading text-[1.65rem] text-white"
              style={{ "--menu-index": index } as CSSProperties}
            >
              {label} <span className="font-body text-base text-white/38" aria-hidden="true">→</span>
            </a>
          ))}
        </nav>

        <div className="public-menu-drawer__actions mt-auto grid gap-3">
          <Link
            href="/login"
            onClick={closeMenu}
            tabIndex={menuOpen ? 0 : -1}
            className="flex min-h-12 items-center justify-center rounded-full border border-white/16 text-[12px] font-semibold text-white"
          >
            Sign in
          </Link>
          <a
            href={CONTACT_SECTION_HREF}
            onClick={closeMenu}
            tabIndex={menuOpen ? 0 : -1}
            className="flex min-h-12 items-center justify-center rounded-full bg-white px-5 text-[12px] font-semibold text-ink"
          >
            Talk to us
          </a>
        </div>
      </aside>
    </>
  );
}
