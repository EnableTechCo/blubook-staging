"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const comparison = {
  before: [
    "Separate inbox threads",
    "Status gathered by follow-up",
    "The same context repeated",
    "Ownership scattered across suppliers",
  ],
  blubook: [
    "One visible service record",
    "Supported status updates",
    "Context attached to each request",
    "Assignment held in one workflow",
  ],
};

export function LandingComparison() {
  const [mode, setMode] = useState<keyof typeof comparison>("blubook");
  const listRef = useRef<HTMLDivElement>(null);
  const previousModeRef = useRef(mode);

  useEffect(() => {
    if (previousModeRef.current === mode) return;

    const direction = mode === "blubook" ? 1 : -1;
    previousModeRef.current = mode;
    const list = listRef.current;

    if (
      !list?.animate ||
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
    ) {
      return;
    }

    const animation = list.animate(
      [
        { opacity: 0.45, transform: `translateX(${direction * 14}px)` },
        { opacity: 1, transform: "translateX(0)" },
      ],
      {
        duration: 240,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)",
      },
    );

    return () => animation.cancel();
  }, [mode]);

  return (
    <section className="bg-white py-20 md:py-24" data-motion-reveal>
      <div className="mx-auto grid max-w-[1150px] grid-cols-1 overflow-hidden px-5 md:grid-cols-2 lg:px-7">
        <div className="relative aspect-[5/6] w-full overflow-hidden bg-cream md:aspect-auto md:min-h-[620px]">
          <Image
            src="/images/editorial/south-africa-operations-desk.jpg"
            alt="Operational documents arranged by a South African specialist for coordinated review"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center bg-paper px-7 py-14 md:px-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cobalt">A calmer operating rhythm</p>
          <h2 className="mt-4 font-body text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink">
            Less chasing.
            <br />
            More knowing.
          </h2>
          <span className="public-section-accent mt-6" aria-hidden="true" />

          <div
            className="mt-9 inline-flex self-start rounded-lg border border-ink/12 bg-white p-1"
            role="group"
            aria-label="Compare ways of working"
          >
            <button
              type="button"
              onClick={() => setMode("before")}
              aria-pressed={mode === "before"}
              className={`min-h-9 rounded-md border px-5 font-body text-xs font-medium tracking-wide transition-colors ${
                mode === "before"
                  ? "border-cobalt/15 bg-cobalt-wash text-cobalt-deep"
                  : "border-transparent text-ink/60 hover:bg-paper hover:text-cobalt"
              }`}
            >
              Before
            </button>
            <button
              type="button"
              onClick={() => setMode("blubook")}
              aria-pressed={mode === "blubook"}
              className={`min-h-9 rounded-md border px-5 font-body text-xs font-medium tracking-wide transition-colors ${
                mode === "blubook"
                  ? "border-cobalt/15 bg-cobalt-wash text-cobalt-deep"
                  : "border-transparent text-ink/60 hover:bg-paper hover:text-cobalt"
              }`}
            >
              With BluBook
            </button>
          </div>

          <div ref={listRef} className="mt-8 border-y border-ink/10" aria-live="polite">
            {comparison[mode].map((item) => (
              <p
                key={item}
                className="flex min-h-14 items-center justify-between gap-5 border-b border-ink/8 px-1 py-4 font-body text-[15px] text-ink/80 last:border-b-0"
              >
                {item}
                <span className="shrink-0 text-cobalt" aria-hidden="true">
                  {mode === "blubook" ? "✓" : "×"}
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
