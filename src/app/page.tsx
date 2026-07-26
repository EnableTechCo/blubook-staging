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

export default function HomePage() {
  return (
    <div id="top" className="min-h-screen bg-paper text-ink">
      <LandingHeader />

      <main>
        <section className="grid min-h-[calc(100svh-4.5rem)] border-b border-ink lg:grid-cols-[0.86fr_1.14fr]">
          <div className="flex flex-col justify-center bg-paper-grid bg-[length:100%_31px] px-5 py-14 sm:px-10 lg:px-[6.5vw] lg:py-20">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
              Human-led business operations · South Africa
            </p>
            <h1 className="mt-5 max-w-[9ch] font-heading text-[clamp(3.7rem,7.4vw,7.2rem)] font-medium leading-[0.78] tracking-[-0.065em]">
              Business, with{" "}
              <em className="block font-normal text-cobalt">fewer loose ends.</em>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              BluBook brings recurring business services, accountable specialists, and
              moving deadlines into one clear operating relationship.
            </p>
            <div className="mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <a
                href={CONTACT_SECTION_HREF}
                className="inline-flex min-h-12 items-center gap-4 bg-cobalt px-5 text-sm font-semibold text-white hover:bg-cobalt-deep"
              >
                Speak to an operations specialist <span aria-hidden="true">→</span>
              </a>
              <a
                href="#how-it-works"
                className="border-b border-ink pb-1 text-sm font-semibold hover:text-cobalt"
              >
                See how it works <span aria-hidden="true">↘</span>
              </a>
            </div>
            <div className="mt-7 flex flex-col gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-cobalt sm:flex-row sm:gap-6">
              <span>✓ No self-service package maze</span>
              <span>✓ One accountable view of the work</span>
            </div>
          </div>

          <div className="relative min-h-[32rem] overflow-hidden bg-cobalt lg:min-h-full">
            <Image
              src="/images/landing/hero-team.jpg"
              alt="A business team planning together around a table"
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/55 to-transparent" />
            <aside className="absolute bottom-6 left-5 w-52 border border-ink bg-sun p-5 text-ink shadow-[8px_8px_0_rgba(19,38,60,0.24)] sm:bottom-10 sm:left-10">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em]">
                Your operating week
              </span>
              <strong className="mt-3 block font-heading text-3xl font-medium leading-tight">
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
          {[
            "Administration",
            "Compliance",
            "Financial support",
            "Logistics",
            "Professional services",
          ].map((item) => (
            <span key={item} className="border-white/15 py-2 sm:border-r sm:last:border-r-0">
              {item}
            </span>
          ))}
        </section>

        <section
          id="why-blubook"
          className="scroll-mt-20 bg-paper-grid bg-[length:100%_31px] px-5 py-20 sm:px-10 lg:px-[8vw] lg:py-32"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
            A different kind of operations partner
          </p>
          <h2 className="mt-6 max-w-[18ch] font-heading text-[clamp(2.6rem,5.4vw,5.8rem)] font-medium leading-[0.95] tracking-[-0.055em]">
            BluBook connects the work your business needs{" "}
            <em className="font-normal text-cobalt">
              with accountable people trusted to deliver it.
            </em>
          </h2>
          <div className="mt-12 grid gap-7 border-t border-ink/25 pt-8 text-sm leading-7 text-slate-600 md:ml-auto md:max-w-4xl md:grid-cols-2">
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

        <section id="how-it-works" className="scroll-mt-20 bg-ink bg-navy-grid bg-[length:100%_30px] px-5 py-20 text-paper-light sm:px-10 lg:px-[7vw] lg:py-28">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sun">
            How it works
          </p>
          <h2 className="mt-5 font-heading text-[clamp(2.8rem,5vw,5.2rem)] font-medium leading-[0.95] tracking-[-0.05em]">
            One conversation in.
            <br />
            Coordinated work out.
          </h2>
          <div className="mt-16 grid border-t border-white/25 md:grid-cols-2 xl:grid-cols-4">
            {process.map((step) => (
              <article
                key={step.number}
                className="border-b border-white/20 py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"
              >
                <span className="grid size-10 place-items-center bg-sun font-mono text-[10px] text-ink">
                  {step.number}
                </span>
                <h3 className="mt-12 font-heading text-2xl font-medium">{step.title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <LandingComparison />

        <section
          id="arrangements"
          className="scroll-mt-20 bg-paper-grid bg-[length:100%_31px] px-5 py-20 sm:px-10 lg:px-[7vw] lg:py-28"
        >
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
                Service arrangements
              </p>
              <h2 className="mt-5 max-w-[14ch] font-heading text-[clamp(2.8rem,5vw,5rem)] font-medium leading-[0.95] tracking-[-0.05em]">
                Configured around the business. Never picked off a shelf.
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-slate-600">
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
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-cobalt">
                  {item.number}
                </span>
                <h3 className="mt-14 font-heading text-2xl font-medium">{item.title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">{item.copy}</p>
                <a
                  href={CONTACT_SECTION_HREF}
                  className="mt-10 inline-block border-b border-ink pb-1 text-xs font-semibold hover:text-cobalt"
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
              src="/images/landing/advisor-consultation.jpg"
              alt="A BluBook specialist speaking with a business owner"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center bg-cobalt px-6 py-16 text-white sm:px-10 lg:px-[7vw]">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sun-light">
              Human where it matters
            </p>
            <blockquote className="mt-6 max-w-[13ch] font-heading text-[clamp(2.5rem,4vw,4.5rem)] leading-[0.98] tracking-[-0.045em]">
              “The workspace carries the detail. The relationship keeps it accountable.”
            </blockquote>
            <p className="mt-8 max-w-xl text-sm leading-7 text-white/75">
              From onboarding to completed requests, BluBook keeps the operating record
              visible while Staff coordinates the people and services behind it.
            </p>
            <a
              href={CONTACT_SECTION_HREF}
              className="mt-8 inline-flex min-h-12 w-fit items-center gap-4 bg-paper-light px-5 text-sm font-semibold text-ink hover:bg-sun-light"
            >
              Start the conversation <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <section
          id="contact"
          className="scroll-mt-20 bg-paper-grid bg-[length:100%_31px] px-5 py-24 text-center sm:px-10 lg:py-36"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
            Your next loose end can start here
          </p>
          <h2 className="mx-auto mt-5 max-w-[14ch] font-heading text-[clamp(3.4rem,7vw,7rem)] font-medium leading-[0.82] tracking-[-0.065em]">
            Make the business <em className="block font-normal text-cobalt">feel lighter.</em>
          </h2>
          <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
            <a
              href={EXAMPLE_PHONE_HREF}
              aria-label={`Talk to BluBook on the example consultation line ${EXAMPLE_PHONE_DISPLAY}`}
              className="inline-flex min-h-12 items-center gap-5 bg-cobalt px-6 text-sm font-semibold text-white hover:bg-cobalt-deep"
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
        <a href="#top" className="flex items-center gap-3" aria-label="BluBook home">
          <Image src="/images/blubook-logo-mark.png" width={30} height={30} alt="" />
          <strong className="text-lg tracking-[-0.04em]">blubook</strong>
        </a>
        <p className="text-xs text-white/55 md:text-center">
          Business services, intelligently coordinated.
        </p>
        <div className="flex items-center gap-5 text-xs md:justify-end">
          <Link href="/login" className="hover:text-sun-light">
            Sign in
          </Link>
          <span className="text-white/60">South Africa · 2026</span>
        </div>
      </footer>
    </div>
  );
}
