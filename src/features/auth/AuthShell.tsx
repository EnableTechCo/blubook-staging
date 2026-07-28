import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/ui/BrandMark";
import { Eyebrow } from "@/components/ui/Editorial";

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
    <main className="grid min-h-[100svh] bg-paper text-ink lg:grid-cols-[0.92fr_1.08fr]">
      <section className="relative hidden min-h-[100svh] overflow-hidden border-r border-ink bg-ink text-paper-light lg:grid lg:grid-rows-[auto_1fr_auto]">
        <Link
          href="/"
          aria-label="BluBook home"
          className="relative z-10 m-10 w-fit hover:text-sun-light xl:mx-[6vw]"
        >
          <BrandMark inverse />
        </Link>

        <div className="relative mx-10 mb-10 min-h-[28rem] overflow-hidden border border-paper/25 xl:mx-[6vw]">
          <Image
            src="/images/editorial/south-africa-advisor-session.jpg"
            alt="A South African business owner in a working session with an advisor"
            fill
            priority
            sizes="(min-width: 1024px) 46vw, 0px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 xl:p-10">
            <Eyebrow className="text-sun">BluBook workspace</Eyebrow>
            <h2 className="mt-5 max-w-[12ch] font-heading text-[clamp(3.2rem,4.5vw,5.7rem)] font-normal leading-[0.87] tracking-[-0.045em]">
              {panelTitle}
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-paper/75">{panelCopy}</p>
          </div>
        </div>

        <p className="relative z-10 mx-10 mb-10 max-w-sm border-t border-paper/20 pt-5 font-mono text-[9px] uppercase leading-5 tracking-[0.1em] text-paper/60 xl:mx-[6vw]">
          Business services, intelligently coordinated.
        </p>
      </section>

      <section className="flex min-h-[100svh] flex-col bg-paper-grid bg-[length:100%_31px]">
        <header className="flex min-h-20 items-center justify-between border-b border-ink/30 px-5 sm:px-10 lg:px-[7vw]">
          <Link
            href="/"
            aria-label="BluBook home"
            className="text-ink hover:text-rust lg:hidden"
          >
            <BrandMark compact />
          </Link>
          <Link
            href="/"
            className="ml-auto border-b border-ink pb-1 text-xs font-semibold uppercase tracking-[0.06em] hover:border-rust hover:text-rust"
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
