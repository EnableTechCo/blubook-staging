import Link from "next/link";
import { LandingHeader } from "@/components/public/LandingHeader";
import { CONTACT_SECTION_HREF } from "@/components/public/contact";
import { BrandMark } from "@/components/ui/BrandMark";
import type { PublicPageContent } from "@/content/publicPages";

export function PublicEditorialPage({ page }: { page: PublicPageContent }) {
  return (
    <div id="top" className="public-site min-h-screen bg-paper text-ink">
      <LandingHeader />

      <main>
        <section className="relative isolate overflow-hidden bg-ink px-5 pb-20 pt-36 text-white sm:pb-24 sm:pt-44 lg:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(37,128,215,0.3),transparent_38%)]" aria-hidden="true" />
          <div className="relative mx-auto max-w-[1150px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sun">
              {page.eyebrow}
            </p>
            <h1 className="mt-5 max-w-[16ch] font-heading text-[3rem] font-normal leading-[0.98] tracking-[-0.035em] sm:text-[4.3rem]">
              {page.title}
            </h1>
            <p className="mt-7 max-w-[760px] text-[16px] leading-8 text-white/72 sm:text-[18px]">
              {page.intro}
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-[1150px] gap-12 px-5 py-16 md:grid-cols-[220px_minmax(0,1fr)] md:py-20 lg:px-7">
          <aside className="md:sticky md:top-24 md:self-start">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/42">
              On this page
            </p>
            <nav className="mt-4 grid border-t border-ink/10" aria-label={page.title + " sections"}>
              {page.sections.map((section) => (
                <a
                  key={section.id}
                  href={"#" + section.id}
                  className="border-b border-ink/10 py-3 text-[13px] font-medium text-ink/62 hover:text-cobalt"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
            {page.sections.map((section, sectionIndex) => (
              <section
                key={section.id}
                id={section.id}
                className={"scroll-mt-24 " + (sectionIndex ? "border-t border-ink/12 pt-14 " : "") + "pb-14 last:pb-0"}
              >
                {section.kicker ? (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cobalt">
                    {section.kicker}
                  </p>
                ) : null}
                <h2 className="mt-3 max-w-[28ch] font-heading text-[2.15rem] font-normal leading-[1.06] tracking-[-0.025em] sm:text-[2.65rem]">
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-6 max-w-[760px] text-[15px] leading-7 text-ink/68">
                    {paragraph}
                  </p>
                ))}

                {section.bullets ? (
                  <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                    {section.bullets.map((item) => (
                      <li key={item} className="border-l-2 border-cobalt/55 pl-4 text-[14px] leading-6 text-ink/72">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.items ? (
                  <div className="mt-8 grid gap-4">
                    {section.items.map((item) => (
                      <details key={item.title} className="group rounded-lg bg-white shadow-[0_10px_28px_rgba(25,61,110,0.07)]">
                        <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 marker:hidden">
                          <span>
                            <span className="block font-heading text-[1.45rem] leading-tight">{item.title}</span>
                            {item.subtitle ? (
                              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-cobalt">
                                {item.subtitle}
                              </span>
                            ) : null}
                          </span>
                          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/12 text-lg text-cobalt transition-transform duration-200 group-open:rotate-45" aria-hidden="true">
                            +
                          </span>
                        </summary>
                        <div className="border-t border-ink/10 px-6 pb-6">
                          {item.paragraphs?.map((paragraph) => (
                            <p key={paragraph} className="mt-5 text-[14px] leading-7 text-ink/66">
                              {paragraph}
                            </p>
                          ))}
                          {item.bullets ? (
                            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                              {item.bullets.map((bullet) => (
                                <li key={bullet} className="text-[14px] leading-6 text-ink/68">
                                  <span className="mr-2 text-cobalt" aria-hidden="true">•</span>
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {item.quote ? (
                            <blockquote className="mt-6 border-l-2 border-sun pl-4 font-heading text-[1.2rem] leading-7 text-ink/82">
                              “{item.quote}”
                            </blockquote>
                          ) : null}
                        </div>
                      </details>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </div>

        <section className="bg-white px-5 py-14 lg:px-7">
          <div className="mx-auto flex max-w-[1150px] flex-col items-start justify-between gap-7 rounded-[18px] bg-cobalt px-7 py-10 text-white sm:flex-row sm:items-center sm:px-10">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/62">
                The BluBook promise
              </p>
              <h2 className="mt-3 max-w-[24ch] font-heading text-[2rem] font-normal leading-tight">
                Enterprise capability for every business. Sustainable growth for every community.
              </h2>
            </div>
            <a
              href={"/" + CONTACT_SECTION_HREF}
              className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-white px-6 text-[13px] font-semibold text-cobalt-deep"
            >
              Talk to us
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-ink text-white">
        <div className="mx-auto flex max-w-[1150px] flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-7">
          <Link href="/" className="inline-flex shrink-0 brightness-0 invert" aria-label="BluBook home">
            <BrandMark inverse />
          </Link>
          <p className="text-[12px] text-white/55">© 2026 BluBook · South Africa</p>
        </div>
      </footer>
    </div>
  );
}
