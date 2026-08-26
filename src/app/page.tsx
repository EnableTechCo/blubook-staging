import Link from "next/link";
import type { Metadata } from "next";
import { LandingComparison } from "@/components/public/LandingComparison";
import { LandingHeader } from "@/components/public/LandingHeader";
import { LandingMotion } from "@/components/public/LandingMotion";
import { LandingPromise } from "@/components/public/LandingPromise";
import { LandingStories } from "@/components/public/LandingStories";
import {
  CONTACT_SECTION_HREF,
  EXAMPLE_PHONE_DISPLAY,
  EXAMPLE_PHONE_HREF,
} from "@/components/public/contact";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThreeLogoLoader } from "@/components/ui/ThreeLogoLoader";

export const metadata: Metadata = {
  title: "Business operations, clearly coordinated · BluBook",
  description:
    "BluBook coordinates recurring business services, accountable specialists, and visible service delivery through one managed relationship.",
};

const services = [
  {
    title: "Administration",
    copy: "Recurring business administration held in a visible operating rhythm.",
  },
  {
    title: "Compliance",
    copy: "Requirements, supporting documents, reviews, and deadlines kept connected.",
  },
  {
    title: "Financial support",
    copy: "A clearer way to coordinate the financial work around the business.",
  },
  {
    title: "Logistics",
    copy: "Requests and provider hand-offs managed with the working context intact.",
  },
  {
    title: "Professional services",
    copy: "Access to specialist capability through one accountable relationship.",
  },
];

const process = [
  {
    number: "01",
    title: "Start with a conversation.",
    copy: "A BluBook specialist learns how your business operates, what needs attention, and which work is expected.",
  },
  {
    number: "02",
    title: "Shape the arrangement.",
    copy: "Staff configures the supported package around the needs assessment instead of asking you to choose from a shelf.",
  },
  {
    number: "03",
    title: "Review the capability.",
    copy: "Available provider capability is reviewed before activation, with unmatched work kept visible for assignment.",
  },
  {
    number: "04",
    title: "Open the workspace.",
    copy: "Onboarding, compliance requirements, and initial service requests enter one traceable operating workflow.",
  },
];

export default function HomePage() {
  return (
    <div id="top" className="public-site min-h-screen bg-white text-ink">
      <LandingMotion />
      <LandingHeader />

      <main>
        <section
          className="public-cinematic-hero relative isolate flex min-h-screen min-h-[100svh] items-center overflow-hidden bg-ink text-white"
          data-motion-hero
        >
          <div className="public-cinematic-hero__media absolute inset-0" data-motion-hero-media>
            <video
              className="public-cinematic-hero__video"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            >
              <source
                media="(max-width: 767px)"
                src="https://videos.pexels.com/video-files/3129957/3129957-sd_640_360_25fps.mp4"
                type="video/mp4"
              />
              <source
                src="https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4"
                type="video/mp4"
              />
            </video>
          </div>
          <div className="public-cinematic-hero__veil absolute inset-0" aria-hidden="true" />

          <div
            className="relative z-10 mx-auto flex w-full max-w-[1120px] flex-col items-center px-5 pb-28 pt-32 text-center sm:px-8"
            data-motion-hero-content
          >
            {/* The top of this scale was 7.15rem, which rendered at 114px on a
                1440 screen — 3.6x the section headings and a seventh of the
                viewport. Still a hero at 5.25rem, without swamping the page. */}
            <h1 className="public-hero-reveal public-text-glow max-w-[13ch] font-heading text-[2.6rem] font-normal leading-[0.94] tracking-[-0.038em] text-white sm:text-[3.5rem] md:text-[4.4rem] lg:text-[5.25rem]">
              Business, with fewer loose ends.
            </h1>
            <p className="public-hero-reveal mt-7 max-w-[590px] text-[14px] font-light leading-6 text-white/72 sm:text-[16px] sm:leading-7" data-delay="1">
              BluBook brings recurring business services, accountable specialists, and
              moving deadlines into one clear operating relationship.
            </p>
            <div className="public-hero-reveal mt-9 flex flex-col items-center gap-4 sm:flex-row" data-delay="2">
              <a
                href={CONTACT_SECTION_HREF}
                className="public-action public-primary-pill inline-flex min-h-12 items-center gap-5 rounded-full bg-white px-7 py-3 text-[13px] font-semibold text-ink"
              >
                Speak to an operations specialist
                <span className="public-action-arrow" aria-hidden="true">→</span>
              </a>
              <a
                href="#what-we-do"
                className="public-action public-glass-button inline-flex min-h-12 items-center gap-3 rounded-full px-7 py-3 text-[13px] font-semibold text-white"
              >
                Explore what we do <span className="public-action-arrow" aria-hidden="true">↓</span>
              </a>
            </div>
          </div>

          <a href="#why-blubook" className="public-scroll-cue absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-white/48">
            Scroll
            <span aria-hidden="true" />
          </a>
        </section>

        <LandingPromise />

        <section
          id="what-we-do"
          className="public-section-fade public-section-fade--white scroll-mt-20 bg-white py-16 md:py-20"
          data-motion-section
        >
          <div className="mx-auto max-w-[1150px] px-5 lg:px-7">
            <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] md:items-end" data-motion-reveal>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cobalt">What we coordinate</p>
                <h2 className="mt-4 max-w-[24ch] font-body text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em]">
                  Services that drive a calmer operating rhythm.
                </h2>
                <span className="public-section-accent mt-6" aria-hidden="true" />
              </div>
              <p className="max-w-xl text-[15px] leading-7 text-ink/65 md:justify-self-end">
                Support is configured around the business after a human conversation. These
                are capability areas, not public price plans or self-service packages.
              </p>
            </div>

            <div className="mt-10 grid border-l border-t border-ink/14 sm:grid-cols-2 xl:grid-cols-4" data-motion-reveal-group>
              {services.map((service) => (
                <a
                  key={service.title}
                  href={CONTACT_SECTION_HREF}
                  className="public-service-cell group flex min-h-48 flex-col justify-between border-b border-r border-ink/14 bg-white p-6 text-ink"
                  data-motion-card
                >
                  <div>
                    <h3 className="font-heading text-[1.5rem] font-normal leading-tight">{service.title}</h3>
                    <p className="mt-3 max-w-[32ch] text-[14px] leading-6 text-ink/58 group-hover:text-white/74">
                      {service.copy}
                    </p>
                  </div>
                  <span className="public-service-arrow mt-8 grid size-10 place-items-center border border-ink/15 text-lg group-hover:border-white/35 group-hover:bg-white group-hover:text-cobalt" aria-hidden="true">→</span>
                </a>
              ))}

              <div className="flex min-h-48 flex-col justify-between border-b border-r border-ink/14 bg-cobalt-wash p-6 sm:col-span-1 xl:col-span-3" data-motion-card>
                <p className="max-w-xl font-heading text-[1.8rem] font-normal leading-tight text-ink md:text-[2.15rem]">
                  Not sure where the work belongs? Start with the business, not the category.
                </p>
                <a href={CONTACT_SECTION_HREF} className="public-action mt-8 inline-flex w-fit items-center gap-3 text-[13px] font-semibold text-cobalt-deep">
                  Discuss your operating needs <span className="public-action-arrow" aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <LandingComparison />

        <section
          id="how-it-works"
          className="public-section-fade public-section-fade--ink scroll-mt-20 bg-ink py-16 text-white md:py-20"
          data-motion-section
        >
          <div className="mx-auto max-w-[1150px] px-5 lg:px-7">
            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] md:items-end" data-motion-reveal>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sun">How it works</p>
                <h2 className="mt-4 font-body text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em]">
                  One conversation in.<br />Coordinated work out.
                </h2>
                <span className="mt-6 block h-1 w-16 bg-gradient-to-r from-cobalt to-sun" aria-hidden="true" />
              </div>
              <p className="max-w-lg text-[15px] leading-7 text-white/62 md:justify-self-end">
                A considered setup gives the workspace the context it needs before work is routed,
                assigned, and tracked.
              </p>
            </div>

            <div className="mt-10 grid border-l border-t border-white/16 md:grid-cols-2 xl:grid-cols-4" data-motion-reveal-group>
              {process.map((step) => (
                <article key={step.number} className="flex min-h-60 flex-col border-b border-r border-white/16 p-6" data-motion-card>
                  <span className="text-[11px] font-semibold tracking-[0.16em] text-sun">{step.number}</span>
                  <h3 className="mt-auto pt-10 font-heading text-[1.5rem] font-normal leading-tight">{step.title}</h3>
                  <p className="mt-3 text-[14px] leading-6 text-white/58">{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <LandingStories />

        <section
          id="contact"
          className="public-section-fade public-section-fade--white scroll-mt-20 bg-white px-5 py-16 md:py-20 lg:px-7"
          data-motion-section
        >
          <div className="mx-auto grid max-w-[1150px] overflow-hidden rounded-[20px] bg-gradient-to-br from-cobalt-deep via-cobalt to-[#6ea8df] text-white shadow-[0_24px_60px_rgba(28,75,145,0.22)] md:grid-cols-[minmax(0,1fr)_300px]" data-motion-reveal>
            <div className="flex flex-col justify-center px-7 py-14 sm:px-12 md:py-16 lg:px-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/68">A clearer operating relationship</p>
              <h2 className="mt-5 max-w-[18ch] font-body text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em]">
                Make the business feel lighter.
              </h2>
              <p className="mt-6 max-w-lg text-[15px] leading-7 text-white/74">
                Begin with a conversation about the work, the deadlines, and the support your business actually needs.
              </p>
              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <a
                  href={EXAMPLE_PHONE_HREF}
                  aria-label={`Talk to BluBook on the example consultation line ${EXAMPLE_PHONE_DISPLAY}`}
                  className="inline-flex min-h-12 items-center rounded-lg bg-white px-6 py-3 text-[13px] font-semibold text-cobalt-deep"
                >
                  Call BluBook <span className="ml-5 border-l border-cobalt/20 pl-5 font-normal text-ink/55">{EXAMPLE_PHONE_DISPLAY}</span>
                </a>
                <span className="text-[11px] text-white/60">Example staging consultation line</span>
              </div>
            </div>
            <div className="relative hidden min-h-[360px] items-center justify-center border-l border-white/18 bg-white/6 md:flex" aria-hidden="true">
              <ThreeLogoLoader placement="landing" />
            </div>
          </div>
        </section>
      </main>

      {/* No section fade here: the fade exists to blend one section's colour into
          the next, and there is nothing after the footer to blend into. */}
      <footer className="border-t border-white/10 bg-ink text-white" data-motion-section>
        <div className="mx-auto flex max-w-[1150px] flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-7">
          <a href="#top" className="inline-flex shrink-0 brightness-0 invert" aria-label="BluBook home">
            <BrandMark inverse />
          </a>

          {/* min-h-8 keeps every link a 32px target. Laid out in a row they
              would otherwise be 20px tall, under the 24px minimum, and a
              compact footer is no reason to make links hard to hit. */}
          <nav className="flex flex-wrap items-center gap-x-6 text-[13px] text-white/70" aria-label="Footer">
            <a href="#why-blubook" className="inline-flex min-h-8 items-center hover:text-white">Why BluBook</a>
            <a href="#what-we-do" className="inline-flex min-h-8 items-center hover:text-white">What we do</a>
            <a href="#how-it-works" className="inline-flex min-h-8 items-center hover:text-white">How it works</a>
            <a href="#insights" className="inline-flex min-h-8 items-center hover:text-white">Insights</a>
            <Link href="/login" className="inline-flex min-h-8 items-center hover:text-white">Sign in</Link>
            <a href={EXAMPLE_PHONE_HREF} className="inline-flex min-h-8 items-center hover:text-white">{EXAMPLE_PHONE_DISPLAY}</a>
          </nav>
        </div>

        <div className="border-t border-white/10">
          {/* white/40 measured 3.74:1 against the ink ground, under the 4.5
              minimum at this size. /55 reads as quiet at 5.85:1. */}
          <div className="mx-auto flex max-w-[1150px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3 text-[10px] uppercase tracking-[0.14em] text-white/55 lg:px-7">
            <span>© 2026 BluBook</span>
            <span>South Africa</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
