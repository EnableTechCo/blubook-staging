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
        <section className="border-b border-ink/15">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-6 pb-24 pt-16 md:grid-cols-12 md:gap-8 md:pt-24">
            <div className="md:col-span-6 md:pr-6">
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-8 bg-ink/50" aria-hidden="true" />
                <Eyebrow>Human-led business operations · South Africa</Eyebrow>
              </div>
              <h1 className="max-w-[9ch] font-heading text-[3.5rem] font-normal leading-[0.98] tracking-tight md:text-[5.25rem]">
                Business, with{" "}
                <em className="font-normal text-rust">fewer loose ends.</em>
              </h1>
              <p className="mt-8 max-w-md text-[15px] leading-relaxed text-ink/70">
                BluBook brings recurring business services, accountable specialists, and
                moving deadlines into one clear operating relationship.
              </p>
              <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <a
                  href={CONTACT_SECTION_HREF}
                  className="inline-flex items-center gap-5 bg-ink px-6 py-3.5 text-[13px] font-medium text-paper transition-colors hover:bg-rust"
                >
                  Speak to an operations specialist <span aria-hidden="true">→</span>
                </a>
                <a
                  href="#how-it-works"
                  className="border-b border-ink pb-1 text-[13px] font-medium transition-colors hover:border-rust hover:text-rust"
                >
                  See how it works <span aria-hidden="true">↘</span>
                </a>
              </div>
              <p className="mt-6 text-[11px] uppercase tracking-[0.16em] text-ink/50">
                No self-service package maze · One accountable view
              </p>
            </div>

            <div className="relative md:col-span-6">
              <div className="relative aspect-[4/5] overflow-hidden md:aspect-[5/6]">
                <Image
                  src="/images/editorial/south-africa-operations-hero-v2.jpg"
                  alt="A South African business owner and advisor working through an operating brief"
                  fill
                  priority
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <aside className="absolute -left-2 bottom-8 w-[190px] rotate-[-3deg] bg-[#F2D77A] p-5 shadow-[6px_8px_0_rgba(28,25,23,0.08)] sm:-left-6 sm:bottom-10 md:-left-12">
                <p className="font-heading text-[1.65rem] leading-none">Moving parts.</p>
                <p className="mt-2 text-[13px]">One managed brief.</p>
                <div className="my-4 border-t border-ink/25" />
                <p className="text-[10px] uppercase tracking-[0.18em] text-ink/65">
                  Coordinated by BluBook
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section
          className="border-b border-ink/15 bg-cream/60"
          aria-label="BluBook service capabilities"
        >
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center px-6 py-5 md:justify-between">
            {capabilities.map((item, index) => (
              <div key={item} className="flex items-center">
                {index > 0 ? (
                  <span className="mx-4 hidden h-4 w-px bg-ink/15 md:block" aria-hidden="true" />
                ) : null}
                <span className="px-2 py-1 text-[11px] uppercase tracking-[0.22em] text-ink/70">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section id="why-blubook" className="scroll-mt-20">
          <div className="mx-auto max-w-[1240px] px-6 py-28">
            <div className="flex justify-center">
              <Eyebrow>A different kind of operations partner</Eyebrow>
            </div>
            <h2 className="mx-auto mt-7 max-w-4xl text-center font-heading text-[2.25rem] font-normal leading-[1.08] tracking-tight md:text-[3.4rem]">
              BluBook connects the work your business needs{" "}
              <em className="font-normal text-rust">
                with accountable people trusted to deliver it.
              </em>
            </h2>
            <div className="mx-auto mt-16 grid max-w-3xl gap-8 border-t border-ink/15 pt-8 text-[14px] leading-7 text-ink/70 md:grid-cols-2">
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
          </div>
        </section>

        <LandingStories />

        <section id="how-it-works" className="scroll-mt-20 bg-ink text-paper">
          <div className="mx-auto max-w-[1240px] px-6 py-28">
            <Eyebrow className="text-[#F2D77A]">How it works</Eyebrow>
            <h2 className="mt-6 font-heading text-[2.75rem] font-normal leading-[1.02] tracking-tight md:text-[4rem]">
              One conversation in.
              <br />
              <em className="font-normal text-[#F2D77A]">Coordinated work out.</em>
            </h2>
            <div className="mt-20 grid gap-10 md:grid-cols-2 xl:grid-cols-4">
              {process.map((step) => (
                <article key={step.number} className="border-t border-paper/25 pt-6">
                  <span className="grid size-9 place-items-center bg-[#F2D77A] text-[10px] text-ink">
                    {step.number}
                  </span>
                  <h3 className="mt-10 font-heading text-[1.65rem] font-normal leading-tight">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-sm text-[13px] leading-6 text-paper/60">
                    {step.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <LandingComparison />

        <section id="arrangements" className="scroll-mt-20 border-b border-ink/15">
          <div className="mx-auto max-w-[1240px] px-6 py-28">
            <Eyebrow>Service arrangements</Eyebrow>
            <h2 className="mt-6 max-w-3xl font-heading text-[2.5rem] font-normal leading-[1.05] tracking-tight md:text-[3.75rem]">
              Configured around the business.{" "}
              <em className="block font-normal text-rust">Never picked off a shelf.</em>
            </h2>
            <p className="mt-7 max-w-md text-[14px] leading-7 text-ink/65">
              These are operating themes, not public price plans. A BluBook specialist
              recommends the supported arrangement after learning what your business needs.
            </p>
            <div className="mt-16 grid gap-px border border-ink/15 bg-ink/15 md:grid-cols-3">
              {arrangements.map((item) => (
                <article key={item.number} className="bg-paper p-8 md:min-h-80 lg:p-10">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-rust">
                    {item.number}
                  </span>
                  <h3 className="mt-12 font-heading text-[1.75rem] font-normal">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-[13px] leading-6 text-ink/65">{item.copy}</p>
                  <a
                    href={CONTACT_SECTION_HREF}
                    className="mt-10 inline-block border-b border-ink pb-1 text-[12px] font-medium hover:border-rust hover:text-rust"
                  >
                    Discuss your needs <span aria-hidden="true">→</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1240px] px-6 py-28 md:grid-cols-12">
          <div className="relative aspect-[4/5] md:col-span-5">
            <Image
              src="/images/editorial/south-africa-advisor-session.jpg"
              alt="A South African business owner speaking with a BluBook advisor"
              fill
              sizes="(min-width: 768px) 42vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center bg-ink px-8 py-16 text-paper md:col-span-7 md:px-20">
            <Eyebrow className="text-[#F2D77A]">Human where it matters</Eyebrow>
            <blockquote className="mt-7 max-w-[16ch] font-heading text-[2rem] italic leading-[1.08] tracking-tight md:text-[2.75rem]">
              “The workspace carries the detail. The relationship keeps it accountable.”
            </blockquote>
            <p className="mt-8 max-w-xl text-[13px] leading-7 text-paper/60">
              From onboarding to completed requests, BluBook keeps the operating record
              visible while Staff coordinates the people and services behind it.
            </p>
            <a
              href={CONTACT_SECTION_HREF}
              className="mt-9 inline-flex w-fit items-center gap-5 bg-[#F2D77A] px-6 py-3.5 text-[13px] font-medium text-ink hover:bg-cream"
            >
              Start the conversation <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 border-t border-ink/15">
          <div className="mx-auto max-w-[1240px] px-6 py-32 text-center">
            <div className="flex justify-center">
              <Eyebrow>Your next loose end can start here</Eyebrow>
            </div>
            <h2 className="mx-auto mt-6 max-w-[14ch] font-heading text-[3rem] font-normal leading-[0.95] tracking-tight md:text-[5.5rem]">
              Make the business{" "}
              <em className="block font-normal text-rust">feel lighter.</em>
            </h2>
            <div className="mt-11 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <a
                href={EXAMPLE_PHONE_HREF}
                aria-label={`Talk to BluBook on the example consultation line ${EXAMPLE_PHONE_DISPLAY}`}
                className="inline-flex items-center gap-5 bg-ink px-6 py-3.5 text-[13px] font-medium text-paper hover:bg-rust"
              >
                Call the example consultation line <span aria-hidden="true">→</span>
              </a>
              <a
                href={EXAMPLE_PHONE_HREF}
                aria-label="Call BluBook on the example consultation line"
                className="border-b border-ink pb-1 text-[12px] tracking-[0.08em]"
              >
                Example line: {EXAMPLE_PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/15">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-16 md:grid-cols-4">
          <div className="md:col-span-2">
            <a href="#top" className="w-fit" aria-label="BluBook home">
              <BrandMark />
            </a>
            <p className="mt-5 max-w-xs text-[13px] leading-6 text-ink/55">
              Business services, intelligently coordinated.
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-ink/45">Navigate</p>
            <div className="mt-5 flex flex-col gap-3 text-[13px]">
              <a href="#what-we-do" className="hover:text-rust">
                What we do
              </a>
              <a href="#how-it-works" className="hover:text-rust">
                How it works
              </a>
              <a href="#contact" className="hover:text-rust">
                Contact
              </a>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-ink/45">Workspace</p>
            <div className="mt-5 flex flex-col gap-3 text-[13px]">
              <Link href="/login" className="hover:text-rust">
                Sign in
              </Link>
              <a href={EXAMPLE_PHONE_HREF} className="hover:text-rust">
                {EXAMPLE_PHONE_DISPLAY}
              </a>
              <span className="text-ink/45">South Africa · 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
