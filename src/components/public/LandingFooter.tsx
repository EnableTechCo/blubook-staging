import Link from "next/link";
import {
  EXAMPLE_PHONE_DISPLAY,
  EXAMPLE_PHONE_HREF,
} from "@/components/public/contact";
import { BrandMark } from "@/components/ui/BrandMark";

export function LandingFooter({ onLandingPage = false }: { onLandingPage?: boolean }) {
  const sectionHref = (anchor: string) => (onLandingPage ? anchor : "/" + anchor);

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
          <a href={sectionHref("#why-blubook")} className="inline-flex min-h-8 items-center hover:text-white">Why BluBook</a>
          <a href={sectionHref("#what-we-do")} className="inline-flex min-h-8 items-center hover:text-white">What we do</a>
          <a href={sectionHref("#how-it-works")} className="inline-flex min-h-8 items-center hover:text-white">How it works</a>
          <a href={sectionHref("#insights")} className="inline-flex min-h-8 items-center hover:text-white">Insights</a>
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
