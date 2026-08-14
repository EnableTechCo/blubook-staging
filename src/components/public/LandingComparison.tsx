"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/Editorial";

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
    <section className="px-3 py-3 sm:px-5" data-motion-reveal>
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 overflow-hidden border-y border-ink/10 bg-paper-light/45 md:grid-cols-2">
        <div className="relative aspect-[5/6] w-full overflow-hidden bg-cream md:aspect-auto md:min-h-[650px]">
          <Image
            src="/images/editorial/south-africa-operations-desk.jpg"
            alt="Operational documents arranged by a South African specialist for coordinated review"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center bg-paper-light/75 px-6 py-16 md:px-16">
          <Eyebrow>A calmer operating rhythm</Eyebrow>
          <h2 className="mt-6 font-heading text-[2.5rem] font-normal leading-[1.02] tracking-[-0.04em] text-ink md:text-[3.5rem]">
            Less chasing.
            <br />
            <em className="font-heading italic text-cobalt">More knowing.</em>
          </h2>

          <div
            className="mt-10 inline-flex self-start rounded-xl border border-ink/10 bg-cream/55 p-1"
            role="group"
            aria-label="Compare ways of working"
          >
            <button
              type="button"
              onClick={() => setMode("before")}
              aria-pressed={mode === "before"}
              className={`min-h-9 rounded-lg border px-5 font-body text-xs font-medium tracking-wide transition-colors ${
                mode === "before"
                  ? "border-cobalt/15 bg-paper-light text-cobalt shadow-sm"
                  : "border-transparent text-ink/60 hover:bg-paper-light hover:text-cobalt"
              }`}
            >
              Before
            </button>
            <button
              type="button"
              onClick={() => setMode("blubook")}
              aria-pressed={mode === "blubook"}
              className={`min-h-9 rounded-lg border px-5 font-body text-xs font-medium tracking-wide transition-colors ${
                mode === "blubook"
                  ? "border-cobalt/15 bg-paper-light text-cobalt shadow-sm"
                  : "border-transparent text-ink/60 hover:bg-paper-light hover:text-cobalt"
              }`}
            >
              With BluBook
            </button>
          </div>

          <div ref={listRef} className="mt-8 border-y border-ink/10" aria-live="polite">
            {comparison[mode].map((item) => (
              <p
                key={item}
                className="flex min-h-14 items-center justify-between gap-5 border-b border-ink/8 px-4 py-4 font-body text-[15px] text-ink/80 last:border-b-0"
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
