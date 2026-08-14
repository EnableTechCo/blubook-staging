import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { LandingComparison } from "@/components/public/LandingComparison";
import { LandingHeader } from "@/components/public/LandingHeader";
import { LandingMotion } from "@/components/public/LandingMotion";
import { LandingStories } from "@/components/public/LandingStories";
import { VantaHeroBackground } from "@/components/public/VantaHeroBackground";
import {
  CONTACT_SECTION_HREF,
  EXAMPLE_PHONE_DISPLAY,
  EXAMPLE_PHONE_HREF,
} from "@/components/public/contact";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThreeLogoLoader } from "@/components/ui/ThreeLogoLoader";
import { Eyebrow } from "@/components/ui/Editorial";

export const metadata: Metadata = {
  title: "Human-led business operations · BluBook",
  description:
    "BluBook coordinates recurring business services, accountable specialists, and visible service delivery through one managed relationship.",
};

const arrangements = [
  {
    title: "Recurring administration",
    copy: "A focused operating rhythm for routine administration, compliance requirements, and scheduled business support.",
  },
  {
    title: "Professional support",
    copy: "Managed access to the service capabilities your business needs, with requests owned and tracked in one workspace.",
  },
  {
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
    <div id="top" className="public-site min-h-screen bg-paper text-ink">
      <LandingMotion />
      <LandingHeader />

      <main>
        <section className="px-3 pb-3 pt-3 sm:px-5">
          <div className="relative isolate mx-auto grid max-w-[1240px] grid-cols-1 gap-10 overflow-hidden rounded-[2rem] border border-white/80 bg-paper-light/75 px-6 py-12 shadow-surface sm:px-10 md:grid-cols-12 md:gap-8 md:py-16 lg:px-14">
            <VantaHeroBackground />
            <div className="relative z-10 md:col-span-6 md:pr-6">
              <div className="public-hero-reveal">
                <div className="mb-8">
                  <Eyebrow>Human-led business operations · South Africa</Eyebrow>
                </div>
                <h1 className="max-w-[10ch] font-heading text-[3.25rem] font-normal leading-[0.98] tracking-[-0.045em] md:text-[4.75rem]">
                  Business, with{" "}
                  <em className="font-normal text-cobalt">fewer loose ends.</em>
                </h1>
              </div>
              <p
                className="public-hero-reveal mt-8 max-w-md text-[15px] leading-relaxed text-ink/65"
                data-delay="1"
              >
                BluBook brings recurring business services, accountable specialists, and
                moving deadlines into one clear operating relationship.
              </p>
              <div className="public-hero-reveal" data-delay="2">
                <div className="mt-10 flex flex-col items-start gap-6 lg:flex-row lg:items-center">
                  <a
                    href={CONTACT_SECTION_HREF}
                    className="public-action inline-flex min-h-12 items-center gap-5 rounded-xl border border-cobalt bg-cobalt px-6 py-3.5 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(45,93,180,0.18)] transition-colors hover:border-cobalt-deep hover:bg-cobalt-deep"
                  >
                    Speak to an operations specialist
                    <span className="public-action-arrow" aria-hidden="true">→</span>
                  </a>
                  <a
                    href="#how-it-works"
                    className="inline-flex min-h-11 items-center border-b border-ink/20 px-1 text-[13px] font-semibold transition-colors hover:border-cobalt hover:text-cobalt"
                  >
                    See how it works <span aria-hidden="true">↘</span>
                  </a>
                </div>
                <p className="mt-6 text-[12px] leading-5 text-ink/50">
                  Human-led setup. One accountable operating view.
                </p>
              </div>
            </div>

            <div className="public-hero-media relative z-10 md:col-span-6">
              <figure className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] shadow-glass md:h-full md:aspect-auto">
                <Image
                  src="/images/editorial/south-africa-operations-hero-v2.jpg"
                  alt="A South African business owner and advisor working through an operating brief"
                  fill
                  priority
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 border-t border-white/20 bg-ink/80 px-5 py-4 text-white backdrop-blur-md sm:px-6">
                  <p className="max-w-[18ch] font-heading text-[1.4rem] leading-tight">
                    Moving parts, held in one managed brief.
                  </p>
                  <p className="hidden shrink-0 text-right text-[9px] uppercase tracking-[0.16em] text-white/60 sm:block">
                    Coordinated by BluBook
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section
          className="px-3 py-3 sm:px-5"
          aria-label="BluBook service capabilities"
        >
          <div
            className="public-rule-draw mx-auto flex max-w-[1240px] flex-wrap items-center justify-center border-y border-transparent px-6 py-5 md:justify-between"
            data-motion-line
          >
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

        <section id="why-blubook" className="scroll-mt-24">
          <div className="mx-auto max-w-[1240px] px-6 py-20 md:py-24" data-motion-reveal>
            <h2 className="mx-auto max-w-4xl text-center font-heading text-[2.25rem] font-normal leading-[1.08] tracking-tight md:text-[3.4rem]">
              BluBook connects the work your business needs{" "}
              <em className="font-normal text-cobalt">
                with accountable people trusted to deliver it.
              </em>
            </h2>
            <div
              className="public-rule-draw public-rule-draw--top mx-auto mt-10 grid max-w-3xl gap-8 border-t border-transparent pt-8 text-[14px] leading-7 text-ink/70 md:grid-cols-2"
              data-motion-line
            >
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

        <section id="how-it-works" className="scroll-mt-24 px-3 py-3 sm:px-5">
          <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[2rem] border border-white/10 bg-ink px-6 py-16 text-white shadow-glass md:px-10 md:py-20 lg:px-14">
            <Eyebrow className="text-sun">How it works</Eyebrow>
            <h2 className="mt-6 font-heading text-[2.75rem] font-normal leading-[1.02] tracking-tight md:text-[4rem]">
              One conversation in.
              <br />
              <em className="font-normal text-sun">Coordinated work out.</em>
            </h2>
            <div className="mt-12 grid gap-10 md:grid-cols-2 xl:grid-cols-4" data-motion-reveal-group>
              {process.map((step) => (
                <article key={step.number} className="border-t border-white/15 pt-6" data-motion-card>
                  <span className="grid size-9 place-items-center rounded-full bg-cobalt text-[10px] text-white">
                    {step.number}
                  </span>
                  <h3 className="mt-10 font-heading text-[1.65rem] font-normal leading-tight">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-sm text-[13px] leading-6 text-white/60">
                    {step.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <LandingComparison />

        <section id="arrangements" className="scroll-mt-24">
          <div className="mx-auto max-w-[1240px] px-6 py-16 md:py-20">
            <div data-motion-reveal>
              <h2 className="max-w-3xl font-heading text-[2.5rem] font-normal leading-[1.05] tracking-tight md:text-[3.75rem]">
                Configured around the business.{" "}
                <em className="block font-normal text-cobalt">Never picked off a shelf.</em>
              </h2>
              <p className="mt-7 max-w-md text-[14px] leading-7 text-ink/65">
                These are operating themes, not public price plans. A BluBook specialist
                recommends the supported arrangement after learning what your business needs.
              </p>
              <a
                href={CONTACT_SECTION_HREF}
                className="public-action mt-8 inline-flex items-center gap-3 border-b border-ink/20 pb-1 text-[12px] font-semibold transition-colors hover:border-cobalt hover:text-cobalt"
              >
                Discuss an arrangement
                <span className="public-action-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            </div>
            <div
              className="public-rule-draw mt-10 grid border-y border-transparent md:grid-cols-3"
              data-motion-reveal-group
              data-motion-line
            >
              {arrangements.map((item) => (
                <article
                  key={item.title}
                  className="p-8 md:min-h-64 md:border-l md:border-ink/10 md:first:border-l-0 lg:p-10"
                  data-motion-card
                >
                  <h3 className="font-heading text-[1.75rem] font-normal">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-[13px] leading-6 text-ink/65">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1240px] px-3 py-3 sm:px-5 md:grid-cols-12" data-motion-reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[2rem] md:col-span-5 md:rounded-l-[2rem] md:rounded-tr-none">
            <Image
              src="/images/editorial/south-africa-advisor-session.jpg"
              alt="A South African business owner speaking with a BluBook advisor"
              fill
              sizes="(min-width: 768px) 42vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center rounded-b-[2rem] bg-ink px-8 py-12 text-white shadow-glass md:col-span-7 md:rounded-b-none md:rounded-r-[2rem] md:px-20">
            <Eyebrow className="text-sun">Human where it matters</Eyebrow>
            <h2 className="mt-7 max-w-[16ch] font-heading text-[2rem] italic leading-[1.08] tracking-tight md:text-[2.75rem]">
              The workspace carries the detail. The relationship keeps it accountable.
            </h2>
            <p className="mt-8 max-w-xl text-[13px] leading-7 text-white/60">
              From onboarding to completed requests, BluBook keeps the operating record
              visible while Staff coordinates the people and services behind it.
            </p>
            <a
              href={CONTACT_SECTION_HREF}
              className="mt-9 inline-flex min-h-12 w-fit items-center gap-5 rounded-xl border border-white/15 bg-white px-6 py-3.5 text-[13px] font-semibold text-ink transition-colors hover:border-cobalt/20 hover:bg-cobalt-wash hover:text-cobalt"
            >
              Start the conversation <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 px-3 py-3 sm:px-5">
          <div
            className="public-rule-draw public-rule-draw--top mx-auto max-w-[1240px] border-t border-transparent px-6 py-20 text-center md:py-24"
            data-motion-line
          >
            <div className="flex justify-center" aria-hidden="true">
              <ThreeLogoLoader placement="landing" />
            </div>
            <h2 className="mx-auto max-w-[14ch] font-heading text-[3rem] font-normal leading-[0.95] tracking-tight md:text-[5.5rem]">
              Make the business{" "}
              <em className="block font-normal text-cobalt">feel lighter.</em>
            </h2>
            <div className="mt-11 flex justify-center">
              <a
                href={EXAMPLE_PHONE_HREF}
                aria-label={`Talk to BluBook on the example consultation line ${EXAMPLE_PHONE_DISPLAY}`}
                className="inline-flex min-h-12 items-center rounded-xl border border-cobalt bg-cobalt px-6 py-3.5 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(45,93,180,0.18)] transition-colors hover:border-cobalt-deep hover:bg-cobalt-deep"
              >
                <span>Call BluBook</span>
                <span className="ml-5 border-l border-white/25 pl-5 font-normal text-white/75">
                  {EXAMPLE_PHONE_DISPLAY}
                </span>
              </a>
            </div>
            <p className="mt-4 text-[11px] text-ink/45">
              Example consultation line for this staging preview.
            </p>
          </div>
        </section>
      </main>

      <footer className="px-3 pb-3 pt-6 sm:px-5">
        <div className="mx-auto grid max-w-[1240px] gap-10 rounded-[2rem] border border-white/10 bg-ink px-6 py-12 text-white shadow-glass md:grid-cols-4 md:px-10">
          <div className="md:col-span-2">
            <a href="#top" className="w-fit" aria-label="BluBook home">
              <BrandMark inverse />
            </a>
            <p className="mt-5 max-w-xs text-[13px] leading-6 text-white/55">
              Business services, intelligently coordinated.
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Navigate</p>
            <div className="mt-5 flex flex-col gap-3 text-[13px]">
              <a href="#what-we-do" className="hover:text-sun-light">
                What we do
              </a>
              <a href="#how-it-works" className="hover:text-sun-light">
                How it works
              </a>
              <a href="#contact" className="hover:text-sun-light">
                Contact
              </a>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Account access</p>
            <div className="mt-5 flex flex-col gap-3 text-[13px]">
              <Link href="/login" className="hover:text-sun-light">
                Sign in
              </Link>
              <a href={EXAMPLE_PHONE_HREF} className="hover:text-sun-light">
                {EXAMPLE_PHONE_DISPLAY}
              </a>
              <span className="text-white/45">South Africa · 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
