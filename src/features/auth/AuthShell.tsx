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
    <main className="grid h-[100svh] w-full overflow-hidden bg-[oklch(95.5%_0.014_85)] text-[oklch(22%_0.012_60)] lg:grid-cols-[0.94fr_1.06fr]">
      <section className="relative hidden h-full min-h-0 overflow-hidden border-r border-[oklch(22%_0.012_60)] bg-[oklch(22%_0.012_60)] text-[oklch(91.8%_0.022_82)] lg:flex lg:flex-col">
        <Link
          href="/"
          aria-label="BluBook home"
          className="relative z-10 mx-10 mt-8 w-fit transition-colors hover:text-[#F2D77A] xl:mx-[5.5vw]"
        >
          <BrandMark inverse />
        </Link>

        <div className="flex min-h-0 flex-1 items-center px-10 py-6 xl:px-[5.5vw]">
          <div className="grid w-full grid-cols-[1px_minmax(0,1fr)] gap-8 xl:gap-12">
            <div className="bg-[oklch(91.8%_0.022_82/0.22)]" aria-hidden="true" />
            <div>
              <p className="flex items-center gap-3 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-[#F2D77A]">
                <span className="size-2 bg-[oklch(60.5%_0.128_40)]" aria-hidden="true" />
                Private workspace
              </p>
              <h2 className="mt-5 max-w-[10.5ch] font-heading text-[clamp(3.25rem,7vh,5.25rem)] font-normal leading-[0.87] tracking-[-0.05em] text-[oklch(91.8%_0.022_82)]">
                {panelTitle}
              </h2>
              <p className="mt-5 max-w-md font-body text-sm leading-6 text-[oklch(91.8%_0.022_82/0.7)]">
                {panelCopy}
              </p>
            </div>
          </div>
        </div>

        <footer className="mx-10 mb-8 grid grid-cols-[auto_1fr] items-end gap-8 border-t border-[oklch(91.8%_0.022_82/0.18)] pt-4 xl:mx-[5.5vw]">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#F2D77A]">
            Secure access
          </span>
          <p className="max-w-sm justify-self-end text-right font-body text-[11px] leading-5 text-[oklch(91.8%_0.022_82/0.55)]">
            Business services, intelligently coordinated.
          </p>
        </footer>
      </section>

      <section className="flex h-full min-h-0 flex-col overflow-hidden bg-[oklch(95.5%_0.014_85)]">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[oklch(22%_0.012_60/0.2)] px-5 sm:h-16 sm:px-10 lg:px-[6.5vw]">
          <Link
            href="/"
            aria-label="BluBook home"
            className="text-[oklch(22%_0.012_60)] transition-colors hover:text-[oklch(60.5%_0.128_40)] lg:hidden"
          >
            <BrandMark compact />
          </Link>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-[oklch(22%_0.012_60/0.5)] lg:block">
            Account portal
          </span>
          <Link
            href="/"
            className="ml-auto border-b border-[oklch(22%_0.012_60)] pb-1 font-body text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors hover:border-[oklch(60.5%_0.128_40)] hover:text-[oklch(60.5%_0.128_40)]"
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
