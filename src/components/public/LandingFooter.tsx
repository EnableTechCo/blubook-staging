import Link from "next/link";
import type { Route } from "next";
import {
  EXAMPLE_PHONE_DISPLAY,
  EXAMPLE_PHONE_HREF,
} from "@/components/public/contact";
import { BrandMark } from "@/components/ui/BrandMark";

export function LandingFooter({ onLandingPage = false }: { onLandingPage?: boolean }) {
  return (
    <footer className="border-t border-white/10 bg-ink text-white" data-motion-section>
      <div className="mx-auto flex max-w-[1150px] flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-7">
        <a
          href={onLandingPage ? "#top" : "/"}
          className="inline-flex shrink-0 brightness-0 invert"
          aria-label="BluBook home"
        >
          <BrandMark inverse />
        </a>

        <nav className="flex flex-wrap items-center gap-x-6 text-[13px] text-white/70" aria-label="Footer">
          <Link href={"/why-blubook" as Route} className="inline-flex min-h-8 items-center hover:text-white">Why BluBook</Link>
          <Link href={"/our-services" as Route} className="inline-flex min-h-8 items-center hover:text-white">What we do</Link>
          <Link href={"/#how-it-works" as Route} className="inline-flex min-h-8 items-center hover:text-white">How it works</Link>
          <Link href={"/insights" as Route} className="inline-flex min-h-8 items-center hover:text-white">Insights</Link>
          <Link href="/login" className="inline-flex min-h-8 items-center hover:text-white">Sign in</Link>
          <a href={EXAMPLE_PHONE_HREF} className="inline-flex min-h-8 items-center hover:text-white">{EXAMPLE_PHONE_DISPLAY}</a>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1150px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3 text-[10px] uppercase tracking-[0.14em] text-white/55 lg:px-7">
          <span>© 2026 BluBook</span>
          <span>South Africa</span>
        </div>
      </div>
    </footer>
  );
}
