import {
  EXAMPLE_PHONE_DISPLAY,
  EXAMPLE_PHONE_HREF,
} from "@/components/public/contact";
import { ThreeLogoLoader } from "@/components/ui/ThreeLogoLoader";

export function LandingContact() {
  return (
    <section
      id="contact"
      className="public-section-fade public-section-fade--white scroll-mt-20 bg-white px-5 py-16 md:py-20 lg:px-7"
      data-motion-section
    >
      <div
        className="mx-auto grid max-w-[1150px] overflow-hidden rounded-[20px] bg-gradient-to-br from-cobalt-deep via-cobalt to-[#6ea8df] text-white shadow-[0_24px_60px_rgba(28,75,145,0.22)] md:grid-cols-[minmax(0,1fr)_300px]"
        data-motion-reveal
      >
        <div className="flex flex-col justify-center px-7 py-14 sm:px-12 md:py-16 lg:px-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/68">
            A clearer operating relationship
          </p>
          <h2 className="mt-5 max-w-[18ch] font-body text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em]">
            Make the business feel lighter.
          </h2>
          <p className="mt-6 max-w-lg text-[15px] leading-7 text-white/74">
            Begin with a conversation about the work, the deadlines, and the support your business actually needs.
          </p>
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a
              href={EXAMPLE_PHONE_HREF}
              aria-label={"Talk to BluBook on the example consultation line " + EXAMPLE_PHONE_DISPLAY}
              className="inline-flex min-h-12 items-center rounded-lg bg-white px-6 py-3 text-[13px] font-semibold text-cobalt-deep"
            >
              Call BluBook
              <span className="ml-5 border-l border-cobalt/20 pl-5 font-normal text-ink/55">
                {EXAMPLE_PHONE_DISPLAY}
              </span>
            </a>
            <span className="text-[11px] text-white/60">Example staging consultation line</span>
          </div>
        </div>
        <div
          className="relative hidden min-h-[360px] items-center justify-center border-l border-white/18 bg-white/6 md:flex"
          aria-hidden="true"
        >
          <ThreeLogoLoader placement="landing" />
        </div>
      </div>
    </section>
  );
}
