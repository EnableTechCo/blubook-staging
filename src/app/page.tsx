import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { LandingComparison } from "@/components/public/LandingComparison";
import { LandingHeader } from "@/components/public/LandingHeader";
import { LandingStories } from "@/components/public/LandingStories";
import {
  CONTACT_SECTION_HREF,
  EXAMPLE_PHONE_DISPLAY,
  EXAMPLE_PHONE_HREF,
} from "@/components/public/contact";
import { BrandMark } from "@/components/ui/BrandMark";
import { Eyebrow } from "@/components/ui/Editorial";

export const metadata: Metadata = {
  title: "Human-led business operations · BluBook",
  description:
    "BluBook coordinates recurring business services, accountable specialists, and visible service delivery through one managed relationship.",
};

const arrangements = [
  {
    number: "01",
    title: "Recurring administration",
    copy: "A focused operating rhythm for routine administration, compliance requirements, and scheduled business support.",
  },
  {
    number: "02",
    title: "Professional support",
    copy: "Managed access to the service capabilities your business needs, with requests owned and tracked in one workspace.",
  },
  {
    number: "03",
    title: "Operational coordination",
    copy: "A tailored arrangement for businesses balancing multiple services, providers, deadlines, and active requests.",
  },
];

const process = [
  {
    number: "01",
    title: "Start with a conversation.",
    copy: "Sales or Staff learns how your business operates, what needs attention, and which work is expected.",
  },
  {
    number: "02",
    title: "We shape the arrangement.",
    copy: "Staff configures and assigns the supported package around the needs assessment.",
  },
  {
    number: "03",
    title: "Available capability is reviewed.",
    copy: "Staff reviews current provider capabilities before activation. Work without a match can remain awaiting assignment.",
  },
  {
    number: "04",
    title: "The Client workspace opens.",
    copy: "Staff provisions onboarding, the compliance checklist, and initial service requests, which then enter the existing routing workflow.",
  },
];

const capabilities = [
  "Administration",
  "Compliance",
  "Financial support",
  "Logistics",
  "Professional services",
];

export default function HomePage() {
  return (
    <div id="top" className="min-h-screen bg-paper text-ink">
      <LandingHeader />

      <main>
        <section className="grid min-h-[calc(100svh-4.5rem)] border-b border-ink lg:grid-cols-[0.86fr_1.14fr]">
          <div className="flex flex-col justify-center bg-paper-grid bg-[length:100%_31px] px-5 py-16 sm:px-10 lg:px-[6.5vw] lg:py-24">
            <Eyebrow>Human-led business operations · South Africa</Eyebrow>
            <h1 className="mt-6 max-w-[9ch] font-heading text-[clamp(3.8rem,7.4vw,7.4rem)] font-normal leading-[0.79] tracking-[-0.055em]">
              Business, with{" "}
              <em className="block font-normal text-rust">fewer loose ends.</em>
            </h1>
            <p className="mt-9 max-w-xl text-base leading-7 text-ink/70 sm:text-lg">
              BluBook brings recurring business services, accountable specialists, and
              moving deadlines into one clear operating relationship.
            </p>
            <div className="mt-9 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <a
                href={CONTACT_SECTION_HREF}
                className="inline-flex min-h-12 items-center gap-5 bg-rust px-6 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-rust-deep"
              >
                Speak to an operations specialist <span aria-hidden="true">→</span>
              </a>
              <a
                href="#how-it-works"
                className="border-b border-ink pb-1 text-xs font-semibold uppercase tracking-[0.08em] hover:border-rust hover:text-rust"
              >
                See how it works <span aria-hidden="true">↘</span>
              </a>
            </div>
            <div className="mt-8 grid gap-2 font-mono text-[9px] uppercase tracking-[0.09em] text-rust sm:grid-cols-2">
              <span>✓ No self-service package maze</span>
              <span>✓ One accountable view of the work</span>
            </div>
          </div>

          <div className="relative min-h-[34rem] overflow-hidden bg-ink lg:min-h-full">
            <Image
              src="/images/editorial/south-africa-operations-hero.jpg"
              alt="A South African business owner and operations specialist reviewing a working brief"
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
            <aside className="absolute bottom-6 left-5 w-56 border border-ink bg-sun p-5 text-ink shadow-[8px_8px_0_rgba(38,34,29,0.28)] sm:bottom-10 sm:left-10">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em]">
                Your operating week
              </span>
              <strong className="mt-3 block font-heading text-3xl font-normal leading-tight">
                Moving parts.
              </strong>
              <p className="mt-1 text-sm">One managed brief.</p>
              <div className="my-4 border-t border-ink/30" />
              <small className="font-mono text-[9px] uppercase tracking-[0.1em]">
                Coordinated by BluBook
              </small>
            </aside>
          </div>
        </section>

        <section
          className="grid border-b border-ink bg-ink px-5 py-4 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-paper-light sm:grid-cols-3 lg:grid-cols-5"
          aria-label="BluBook service capabilities"
        >
          {capabilities.map((item) => (
            <span key={item} className="border-paper/15 py-2 sm:border-r sm:last:border-r-0">
              {item}
            </span>
          ))}
        </section>

        <section
          id="why-blubook"
          className="scroll-mt-20 bg-paper-grid bg-[length:100%_31px] px-5 py-20 sm:px-10 lg:px-[8vw] lg:py-32"
        >
          <Eyebrow>A different kind of operations partner</Eyebrow>
          <h2 className="mt-7 max-w-[18ch] font-heading text-[clamp(2.8rem,5.4vw,5.8rem)] font-normal leading-[0.95] tracking-[-0.045em]">
            BluBook connects the work your business needs{" "}
            <em className="font-normal text-rust">
              with accountable people trusted to deliver it.
            </em>
          </h2>
          <div className="mt-14 grid gap-8 border-t border-ink/30 pt-8 text-sm leading-7 text-ink/70 md:ml-auto md:max-w-4xl md:grid-cols-2">
            <p>
              You describe the business and its operational needs to a BluBook specialist.
              Staff shapes the arrangement, creates the required requests, and coordinates
              delivery through the shared workspace.
            </p>
            <p>
              Customers do not browse internal line-item pricing or assemble packages
              themselves. A human conversation comes first so support reflects how the
              business actually works.
            </p>
          </div>
        </section>

        <LandingStories />

        <section
          id="how-it-works"
          className="scroll-mt-20 bg-ink bg-navy-grid bg-[length:100%_30px] px-5 py-20 text-paper-light sm:px-10 lg:px-[7vw] lg:py-28"
        >
          <Eyebrow className="text-sun">How it works</Eyebrow>
          <h2 className="mt-6 font-heading text-[clamp(2.9rem,5vw,5.2rem)] font-normal leading-[0.95] tracking-[-0.04em]">
            One conversation in.
            <br />
            Coordinated work out.
          </h2>
          <div className="mt-16 grid border-t border-paper/25 md:grid-cols-2 xl:grid-cols-4">
            {process.map((step) => (
              <article
                key={step.number}
                className="border-b border-paper/20 py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"
              >
                <span className="grid size-10 place-items-center bg-sun font-mono text-[10px] text-ink">
                  {step.number}
                </span>
                <h3 className="mt-12 font-heading text-2xl font-normal">{step.title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-6 text-paper/65">{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <LandingComparison />

        <section
          id="arrangements"
          className="scroll-mt-20 bg-paper-grid bg-[length:100%_31px] px-5 py-20 sm:px-10 lg:px-[7vw] lg:py-28"
        >
          <div className="grid gap-9 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <Eyebrow>Service arrangements</Eyebrow>
              <h2 className="mt-6 max-w-[14ch] font-heading text-[clamp(2.9rem,5vw,5rem)] font-normal leading-[0.95] tracking-[-0.04em]">
                Configured around the business. Never picked off a shelf.
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-ink/70">
              These are operating themes, not public price plans. A BluBook specialist
              recommends the supported arrangement after learning what your business needs.
            </p>
          </div>
          <div className="mt-14 grid border-y border-ink md:grid-cols-3">
            {arrangements.map((item) => (
              <article
                key={item.number}
                className="border-b border-ink p-6 last:border-b-0 md:min-h-80 md:border-b-0 md:border-r md:last:border-r-0 lg:p-8"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-rust">
                  {item.number}
                </span>
                <h3 className="mt-14 font-heading text-2xl font-normal">{item.title}</h3>
                <p className="mt-4 text-sm leading-6 text-ink/70">{item.copy}</p>
                <a
                  href={CONTACT_SECTION_HREF}
                  className="mt-10 inline-block border-b border-ink pb-1 text-xs font-semibold uppercase tracking-[0.06em] hover:border-rust hover:text-rust"
                >
                  Discuss your needs <span aria-hidden="true">→</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="grid border-y border-ink lg:grid-cols-2">
          <div className="relative min-h-[30rem]">
            <Image
              src="/images/editorial/south-africa-advisor-session.jpg"
              alt="A South African business owner speaking with a BluBook advisor"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center bg-rust px-6 py-16 text-white sm:px-10 lg:px-[7vw]">
            <Eyebrow className="text-sun-light">Human where it matters</Eyebrow>
            <blockquote className="mt-7 max-w-[13ch] font-heading text-[clamp(2.6rem,4vw,4.5rem)] leading-[0.98] tracking-[-0.04em]">
              “The workspace carries the detail. The relationship keeps it accountable.”
            </blockquote>
            <p className="mt-8 max-w-xl text-sm leading-7 text-white/75">
              From onboarding to completed requests, BluBook keeps the operating record
              visible while Staff coordinates the people and services behind it.
            </p>
            <a
              href={CONTACT_SECTION_HREF}
              className="mt-9 inline-flex min-h-12 w-fit items-center gap-5 bg-paper-light px-6 text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:bg-sun-light"
            >
              Start the conversation <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <section
          id="contact"
          className="scroll-mt-20 bg-paper-grid bg-[length:100%_31px] px-5 py-24 text-center sm:px-10 lg:py-36"
        >
          <Eyebrow className="justify-center">Your next loose end can start here</Eyebrow>
          <h2 className="mx-auto mt-6 max-w-[14ch] font-heading text-[clamp(3.4rem,7vw,7rem)] font-normal leading-[0.82] tracking-[-0.055em]">
            Make the business <em className="block font-normal text-rust">feel lighter.</em>
          </h2>
          <div className="mt-11 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <a
              href={EXAMPLE_PHONE_HREF}
              aria-label={`Talk to BluBook on the example consultation line ${EXAMPLE_PHONE_DISPLAY}`}
              className="inline-flex min-h-12 items-center gap-5 bg-rust px-6 text-xs font-semibold uppercase tracking-[0.08em] text-white hover:bg-rust-deep"
            >
              Call the example consultation line <span aria-hidden="true">→</span>
            </a>
            <a
              href={EXAMPLE_PHONE_HREF}
              aria-label="Call BluBook on the example consultation line"
              className="border-b border-ink pb-1 font-mono text-xs tracking-[0.08em]"
            >
              Example line: {EXAMPLE_PHONE_DISPLAY}
            </a>
          </div>
        </section>
      </main>

      <footer className="grid gap-8 bg-ink px-5 py-10 text-paper-light sm:px-10 md:grid-cols-3 md:items-center lg:px-[7vw]">
        <a href="#top" className="w-fit" aria-label="BluBook home">
          <BrandMark inverse />
        </a>
        <p className="text-xs text-paper/55 md:text-center">
          Business services, intelligently coordinated.
        </p>
        <div className="flex items-center gap-5 text-xs md:justify-end">
          <Link href="/login" className="hover:text-sun-light">
            Sign in
          </Link>
          <span className="text-paper/60">South Africa · 2026</span>
        </div>
      </footer>
    </div>
  );
}
