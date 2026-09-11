import { LandingContact } from "@/components/public/LandingContact";
import { LandingFooter } from "@/components/public/LandingFooter";
import { LandingHeader } from "@/components/public/LandingHeader";
import type { PublicPageContent } from "@/content/publicPages";

export function PublicEditorialPage({ page }: { page: PublicPageContent }) {
  return (
    <div id="top" className="public-site min-h-screen bg-paper text-ink">
      <LandingHeader />

      <main>
        <section className="public-cinematic-hero relative isolate flex min-h-screen min-h-[100svh] items-center overflow-hidden text-white">
          <div className="public-cinematic-hero__media public-editorial-hero__media absolute inset-0">
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
          <div className="relative z-10 mx-auto flex w-full max-w-[1120px] flex-col items-center px-5 pb-28 pt-32 text-center sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sun">
              {page.eyebrow}
            </p>
            <h1 className="public-text-glow mt-5 max-w-[16ch] font-heading text-[2.6rem] font-normal leading-[0.94] tracking-[-0.038em] text-white sm:text-[3.5rem] md:text-[4.4rem] lg:text-[5.25rem]">
              {page.title}
            </h1>
            <p className="mt-7 max-w-[700px] text-[14px] font-light leading-6 text-white/72 sm:text-[16px] sm:leading-7">
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

        <LandingContact />
      </main>

      <LandingFooter />
    </div>
  );
}
