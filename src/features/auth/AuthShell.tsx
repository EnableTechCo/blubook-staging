import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

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
    <main className="grid min-h-[100svh] bg-paper text-ink lg:grid-cols-[0.88fr_1.12fr]">
      <section className="relative hidden overflow-hidden border-r border-ink bg-ink bg-navy-grid bg-[length:100%_30px] px-10 py-12 text-paper-light lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-between xl:px-[6vw]">
        <Link
          href="/"
          aria-label="BluBook home"
          className="relative z-10 flex w-fit items-center gap-3 text-paper-light hover:text-sun-light"
        >
          <Image src="/images/blubook-logo-mark.png" width={38} height={38} alt="" priority />
          <span className="font-body text-xl font-semibold tracking-[-0.045em]">blubook</span>
        </Link>

        <div className="relative z-10 max-w-xl py-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sun">
            BluBook workspace
          </p>
          <h2 className="mt-6 max-w-[12ch] font-heading text-[clamp(3.5rem,5vw,6.3rem)] font-medium leading-[0.86] tracking-[-0.06em]">
            {panelTitle}
          </h2>
          <p className="mt-7 max-w-md font-body text-sm leading-7 text-white/65">
            {panelCopy}
          </p>
        </div>

        <p className="relative z-10 max-w-sm font-mono text-[9px] uppercase leading-5 tracking-[0.1em] text-white/60">
          Business services, intelligently coordinated.
        </p>

        <div
          aria-hidden="true"
          className="absolute -bottom-44 -right-44 size-[34rem] rounded-full border border-white/10"
        >
          <div className="absolute inset-20 rounded-full border border-sun/25" />
          <div className="absolute inset-40 rounded-full bg-cobalt/35" />
        </div>
      </section>

      <section className="flex min-h-[100svh] flex-col bg-paper-grid bg-[length:100%_31px]">
        <header className="flex min-h-20 items-center justify-between border-b border-ink/30 px-5 sm:px-10 lg:px-[7vw]">
          <Link
            href="/"
            aria-label="BluBook home"
            className="flex items-center gap-3 text-ink hover:text-cobalt lg:hidden"
          >
            <Image src="/images/blubook-logo-mark.png" width={32} height={32} alt="" priority />
            <span className="font-body text-lg font-semibold tracking-[-0.045em]">blubook</span>
          </Link>
          <Link
            href="/"
            className="ml-auto border-b border-ink pb-1 font-body text-xs font-semibold hover:border-cobalt hover:text-cobalt"
          >
            Return to website <span aria-hidden="true">↗</span>
          </Link>
        </header>

        <div className="flex flex-1 items-center px-5 py-12 sm:px-10 lg:px-[7vw] lg:py-16">
          <div className="w-full max-w-xl">{children}</div>
        </div>
      </section>
    </main>
  );
}
