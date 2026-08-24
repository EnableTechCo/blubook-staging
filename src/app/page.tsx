import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { LandingComparison } from "@/components/public/LandingComparison";
import { LandingHeader } from "@/components/public/LandingHeader";
import { LandingMotion } from "@/components/public/LandingMotion";
import { LandingStories } from "@/components/public/LandingStories";
import {
  CONTACT_SECTION_HREF,
  EXAMPLE_PHONE_DISPLAY,
  EXAMPLE_PHONE_HREF,
} from "@/components/public/contact";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThreeLogoLoader } from "@/components/ui/ThreeLogoLoader";

export const metadata: Metadata = {
  title: "Human-led business operations · BluBook",
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
        <section className="relative isolate flex min-h-[600px] items-center overflow-hidden bg-ink text-white md:min-h-[500px]">
          <Image
            src="/images/editorial/blubook-crystalline-tech-hero-wide-4k.png"
            alt="Blue crystalline technology structures connected across a faceted digital landscape"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[67%_center] md:object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,45,0.78)_0%,rgba(9,25,51,0.6)_34%,rgba(9,25,51,0.16)_68%,rgba(9,25,51,0.08)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,22,45,0.32),transparent_42%)]" />
          <div className="public-hero-bridge pointer-events-none absolute inset-x-0 bottom-0 h-12 md:h-16" aria-hidden="true" />

          <div className="relative mx-auto w-full max-w-[1150px] px-5 pb-10 pt-24 lg:px-7">
            <div className="max-w-[620px] public-hero-reveal">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72">
                Human-led business operations · South Africa
              </p>
              <h1 className="mt-5 text-white">
                <span className="block font-body text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[2.8rem] md:text-[3.05rem]">
                  Business, with
                </span>
                <span className="mt-1 block font-heading text-[2.9rem] font-normal leading-[0.98] tracking-[-0.025em] sm:text-[3.6rem] md:text-[4.15rem]">
                  fewer loose ends.
                </span>
              </h1>
              <span className="mt-5 block h-1 w-16 bg-gradient-to-r from-cobalt to-sun" aria-hidden="true" />
            </div>

            <p className="public-hero-reveal mt-5 max-w-[480px] text-[15px] font-light leading-6 text-white/78" data-delay="1">
              BluBook brings recurring business services, accountable specialists, and
              moving deadlines into one clear operating relationship.
            </p>

            <div className="public-hero-reveal mt-6 flex flex-col items-start gap-5 sm:flex-row sm:items-center" data-delay="2">
              <a
                href={CONTACT_SECTION_HREF}
                className="public-action inline-flex min-h-12 items-center gap-5 rounded-lg bg-gradient-to-r from-cobalt-deep to-cobalt px-6 py-3 text-[13px] font-semibold text-white"
              >
                Speak to an operations specialist
                <span className="public-action-arrow" aria-hidden="true">→</span>
              </a>
              <a
                href="#what-we-do"
                className="public-action inline-flex min-h-11 items-center gap-2 border-b border-white/45 px-1 text-[13px] font-semibold text-white transition-colors hover:border-white"
              >
                Explore what we do <span className="public-action-arrow" aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </section>

        <section id="why-blubook" className="public-hero-followup scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto grid max-w-[1150px] items-center gap-12 px-5 md:grid-cols-2 md:gap-16 lg:px-7" data-motion-reveal>
            <div className="relative min-h-[430px] overflow-hidden bg-paper md:min-h-[570px]">
              <Image
                src="/images/editorial/south-africa-advisor-session.jpg"
                alt="A South African business owner speaking with a BluBook advisor"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="md:py-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cobalt">Why BluBook</p>
              <h2 className="mt-4 max-w-[24ch] font-body text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em]">
                Operational detail, held together by accountable people.
              </h2>
              <span className="public-section-accent mt-6" aria-hidden="true" />
              <div className="mt-8 max-w-xl space-y-5 text-[15px] leading-7 text-ink/66">
                <p>
                  You describe the business and its operational needs to a BluBook specialist.
                  Staff shapes the arrangement, creates the required requests, and coordinates
                  delivery through the shared workspace.
                </p>
                <p>
                  The workspace carries the detail while the relationship keeps the work
                  accountable, from onboarding through to completed requests.
                </p>
              </div>
              <a
                href="#how-it-works"
                className="public-action mt-8 inline-flex items-center gap-3 rounded-lg bg-gradient-to-r from-cobalt-deep to-cobalt px-6 py-3 text-[13px] font-semibold text-white"
              >
                See how BluBook works <span className="public-action-arrow" aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

        <section id="what-we-do" className="scroll-mt-20 bg-white py-20 md:py-24">
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

            <div className="mt-12 grid border-l border-t border-ink/14 sm:grid-cols-2 xl:grid-cols-4" data-motion-reveal-group>
              {services.map((service) => (
                <a
                  key={service.title}
                  href={CONTACT_SECTION_HREF}
                  className="public-service-cell group flex min-h-56 flex-col justify-between border-b border-r border-ink/14 bg-white p-7 text-ink"
                  data-motion-card
                >
                  <div>
                    <h3 className="font-heading text-[1.65rem] font-normal leading-tight">{service.title}</h3>
                    <p className="mt-4 max-w-[25ch] text-[13px] leading-6 text-ink/58 group-hover:text-white/74">
                      {service.copy}
                    </p>
                  </div>
                  <span className="public-service-arrow mt-8 grid size-10 place-items-center border border-ink/15 text-lg group-hover:border-white/35 group-hover:bg-white group-hover:text-cobalt" aria-hidden="true">→</span>
                </a>
              ))}

              <div className="flex min-h-56 flex-col justify-between border-b border-r border-ink/14 bg-cobalt-wash p-7 sm:col-span-1 xl:col-span-3" data-motion-card>
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

        <section id="how-it-works" className="scroll-mt-20 bg-ink py-20 text-white md:py-24">
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
                Human-led setup gives the workspace the context it needs before work is routed,
                assigned, and tracked.
              </p>
            </div>

            <div className="mt-14 grid border-l border-t border-white/16 md:grid-cols-2 xl:grid-cols-4" data-motion-reveal-group>
              {process.map((step) => (
                <article key={step.number} className="flex min-h-72 flex-col border-b border-r border-white/16 p-7" data-motion-card>
                  <span className="text-[11px] font-semibold tracking-[0.16em] text-sun">{step.number}</span>
                  <h3 className="mt-auto pt-12 font-heading text-[1.65rem] font-normal leading-tight">{step.title}</h3>
                  <p className="mt-4 text-[13px] leading-6 text-white/58">{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <LandingStories />

        <section id="contact" className="scroll-mt-20 bg-white px-5 py-20 md:py-24 lg:px-7">
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

      <footer className="border-t border-white/10 bg-ink text-white">
        <div className="mx-auto grid max-w-[1150px] gap-12 px-5 py-16 sm:grid-cols-2 md:grid-cols-4 lg:px-7">
          <div className="sm:col-span-2">
            <a href="#top" className="inline-flex brightness-0 invert" aria-label="BluBook home">
              <BrandMark inverse />
            </a>
            <p className="mt-6 max-w-xs text-[13px] leading-6 text-white/55">
              Business services, intelligently coordinated through one visible operating relationship.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Navigate</p>
            <div className="mt-6 flex flex-col gap-3 text-[13px] text-white/68">
              <a href="#why-blubook" className="hover:text-white">Why BluBook</a>
              <a href="#what-we-do" className="hover:text-white">What we do</a>
              <a href="#how-it-works" className="hover:text-white">How it works</a>
              <a href="#insights" className="hover:text-white">Insights</a>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Account & contact</p>
            <div className="mt-6 flex flex-col gap-3 text-[13px] text-white/68">
              <Link href="/login" className="hover:text-white">Sign in</Link>
              <a href={EXAMPLE_PHONE_HREF} className="hover:text-white">{EXAMPLE_PHONE_DISPLAY}</a>
              <span className="text-white/38">South Africa · 2026</span>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1150px] flex-col gap-2 px-5 py-5 text-[10px] uppercase tracking-[0.14em] text-white/34 sm:flex-row sm:items-center sm:justify-between lg:px-7">
            <span>© 2026 BluBook Network</span>
            <span>Human-led business operations</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
