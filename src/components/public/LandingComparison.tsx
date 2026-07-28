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
    <section className="grid border-b border-ink lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative min-h-[28rem] border-b border-ink lg:min-h-[48rem] lg:border-b-0 lg:border-r">
        <Image
          src="/images/editorial/south-africa-operations-desk.jpg"
          alt="Operational documents arranged by a South African specialist for coordinated review"
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col justify-center bg-paper-light px-5 py-16 sm:px-10 lg:px-[6vw]">
        <Eyebrow>A calmer operating rhythm</Eyebrow>
        <h2 className="mt-6 font-heading text-[clamp(3rem,5vw,5rem)] font-normal leading-[0.88] tracking-[-0.045em]">
          Less chasing.
          <br />
          More knowing.
        </h2>
        <div className="mt-10 grid grid-cols-2 border border-ink" role="group" aria-label="Compare ways of working">
          <button
            type="button"
            onClick={() => setMode("before")}
            aria-pressed={mode === "before"}
            className={`min-h-12 text-xs font-semibold uppercase tracking-[0.08em] ${
              mode === "before" ? "bg-ink text-paper-light" : "hover:bg-cream"
            }`}
          >
            Before
          </button>
          <button
            type="button"
            onClick={() => setMode("blubook")}
            aria-pressed={mode === "blubook"}
            className={`min-h-12 border-l border-ink text-xs font-semibold uppercase tracking-[0.08em] ${
              mode === "blubook" ? "bg-rust text-white" : "hover:bg-cream"
            }`}
          >
            With BluBook
          </button>
        </div>
        <div className="mt-6" aria-live="polite">
          {comparison[mode].map((item) => (
            <p
              key={item}
              className="flex min-h-14 items-center justify-between gap-5 border-b border-ink/20 text-sm"
            >
              {item}
              {mode === "blubook" ? (
                <span className="text-rust" aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
