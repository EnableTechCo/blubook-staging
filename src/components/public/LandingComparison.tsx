"use client";

import Image from "next/image";
import { useState } from "react";
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

  return (
    <section className="border-b border-ink/15 bg-paper">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 md:grid-cols-2">
        <div className="relative aspect-[5/6] w-full overflow-hidden bg-cream md:aspect-auto">
          <Image
            src="/images/editorial/south-africa-operations-desk.jpg"
            alt="Operational documents arranged by a South African specialist for coordinated review"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center bg-paper px-6 py-20 md:px-16">
          <Eyebrow>A calmer operating rhythm</Eyebrow>
          <h2 className="mt-6 font-heading text-[2.5rem] font-normal leading-[1.02] tracking-[-0.04em] text-ink md:text-[3.5rem]">
            Less chasing.
            <br />
            <em className="font-heading italic text-rust">More knowing.</em>
          </h2>

          <div
            className="mt-10 inline-flex self-start border border-ink/15 p-1"
            role="group"
            aria-label="Compare ways of working"
          >
            <button
              type="button"
              onClick={() => setMode("before")}
              aria-pressed={mode === "before"}
              className={`min-h-9 px-5 font-body text-xs font-medium tracking-wide transition-colors ${
                mode === "before"
                  ? "bg-ink text-paper"
                  : "text-ink/60 hover:bg-cream hover:text-ink"
              }`}
            >
              Before
            </button>
            <button
              type="button"
              onClick={() => setMode("blubook")}
              aria-pressed={mode === "blubook"}
              className={`min-h-9 border-l border-ink/15 px-5 font-body text-xs font-medium tracking-wide transition-colors ${
                mode === "blubook"
                  ? "bg-ink text-paper"
                  : "text-ink/60 hover:bg-cream hover:text-ink"
              }`}
            >
              With BluBook
            </button>
          </div>

          <div className="mt-8 border-t border-ink/15" aria-live="polite">
            {comparison[mode].map((item) => (
              <p
                key={item}
                className="flex min-h-14 items-center justify-between gap-5 border-b border-ink/15 py-4 font-body text-[15px] text-ink/85"
              >
                {item}
                <span className="shrink-0 text-rust" aria-hidden="true">
                  {mode === "blubook" ? "✓" : "—"}
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
