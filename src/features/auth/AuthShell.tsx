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
    <main className="auth-workspace grid min-h-[100svh] w-full gap-3 bg-paper p-3 text-ink lg:grid-cols-[0.92fr_1.08fr]">
      <section className="relative hidden min-h-[calc(100svh-1.5rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-ink text-paper-light shadow-glass lg:flex lg:flex-col">
        <Link
          href="/"
          aria-label="BluBook home"
          className="relative z-10 mx-10 mt-9 w-fit transition-colors hover:opacity-80 xl:mx-[5.5vw]"
        >
          <BrandMark inverse priority />
        </Link>

        <div className="flex min-h-0 flex-1 items-center px-10 py-6 xl:px-[5.5vw]">
          <div className="grid w-full grid-cols-[1px_minmax(0,1fr)] gap-8 xl:gap-12">
            <div className="bg-white/15" aria-hidden="true" />
            <div>
              <p className="flex items-center gap-3 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-sun-light">
                <span className="size-2 rounded-full bg-cobalt" aria-hidden="true" />
                Private workspace
              </p>
              <h2 className="mt-6 max-w-[11ch] font-heading text-[clamp(3.15rem,7vh,5rem)] font-normal leading-[0.9] tracking-[-0.045em] text-white">
                {panelTitle}
              </h2>
              <p className="mt-6 max-w-md font-body text-sm leading-6 text-white/65">
                {panelCopy}
              </p>
            </div>
          </div>
        </div>

        <footer className="mx-10 mb-8 flex justify-end border-t border-white/15 pt-4 xl:mx-[5.5vw]">
          <p className="max-w-sm text-right font-body text-[11px] leading-5 text-white/50">
            Business services, intelligently coordinated.
          </p>
        </footer>
      </section>

      <section className="auth-glass flex min-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-paper-light/80 shadow-glass">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink/8 px-5 sm:px-10 lg:px-[6vw]">
          <Link
            href="/"
            aria-label="BluBook home"
            className="text-ink transition-colors hover:text-cobalt lg:hidden"
          >
            <BrandMark compact priority />
          </Link>
          <Link
            href="/"
            className="ml-auto rounded-xl border border-ink/10 bg-paper-light px-4 py-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.08em] shadow-sm transition-colors hover:border-cobalt/25 hover:bg-cobalt-wash hover:text-cobalt"
          >
            Return to website <span aria-hidden="true">↗</span>
          </Link>
        </header>

        <div className="flex flex-1 items-center px-5 py-10 sm:px-10 lg:px-[6vw]">
          <div className="auth-entry w-full max-w-[36rem] px-1 py-4 sm:px-4 sm:py-6">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
