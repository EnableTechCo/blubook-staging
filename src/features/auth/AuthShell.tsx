import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/ui/BrandMark";

export function AuthShell({
  panelTitle,
  panelCopy,
  children,
}: {
  panelTitle: string;
  panelCopy: string;
  children: ReactNode;
}) {
  return (
    <main className="grid h-[100svh] w-full overflow-hidden bg-paper text-ink lg:grid-cols-[0.94fr_1.06fr]">
      <section className="relative hidden h-full min-h-0 overflow-hidden border-r border-ink bg-ink text-cream lg:flex lg:flex-col">
        <Link
          href="/"
          aria-label="BluBook home"
          className="relative z-10 mx-10 mt-8 w-fit transition-colors hover:text-sun xl:mx-[5.5vw]"
        >
          <BrandMark inverse />
        </Link>

        <div className="flex min-h-0 flex-1 items-center px-10 py-6 xl:px-[5.5vw]">
          <div className="grid w-full grid-cols-[1px_minmax(0,1fr)] gap-8 xl:gap-12">
            <div className="bg-cream/20" aria-hidden="true" />
            <div>
              <p className="flex items-center gap-3 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-sun">
                <span className="size-2 bg-cobalt" aria-hidden="true" />
                Private workspace
              </p>
              <h2 className="mt-5 max-w-[10.5ch] font-heading text-[clamp(3.25rem,7vh,5.25rem)] font-normal leading-[0.87] tracking-[-0.05em] text-cream">
                {panelTitle}
              </h2>
              <p className="mt-5 max-w-md font-body text-sm leading-6 text-cream/70">
                {panelCopy}
              </p>
            </div>
          </div>
        </div>

        <footer className="mx-10 mb-8 grid grid-cols-[auto_1fr] items-end gap-8 border-t border-cream/20 pt-4 xl:mx-[5.5vw]">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-sun">
            Secure access
          </span>
          <p className="max-w-sm justify-self-end text-right font-body text-[11px] leading-5 text-cream/55">
            Business services, intelligently coordinated.
          </p>
        </footer>
      </section>

      <section className="flex h-full min-h-0 flex-col overflow-hidden bg-paper">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink/20 px-5 sm:h-16 sm:px-10 lg:px-[6.5vw]">
          <Link
            href="/"
            aria-label="BluBook home"
            className="text-ink transition-colors hover:text-cobalt lg:hidden"
          >
            <BrandMark compact />
          </Link>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-ink/50 lg:block">
            Account portal
          </span>
          <Link
            href="/"
            className="ml-auto border-b border-ink pb-1 font-body text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors hover:border-cobalt hover:text-cobalt"
          >
            Return to website <span aria-hidden="true">↗</span>
          </Link>
        </header>

        <div className="flex min-h-0 flex-1 items-center px-5 py-3 sm:px-10 lg:px-[6.5vw]">
          <div className="w-full max-w-[35rem]">{children}</div>
        </div>
      </section>
    </main>
  );
}
