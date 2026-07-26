"use client";

import Image from "next/image";
import { useState } from "react";

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
          src="/images/landing/operations-desk.jpg"
          alt="Operational documents arranged for coordinated review"
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col justify-center bg-paper-light px-5 py-16 sm:px-10 lg:px-[6vw]">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
          A calmer operating rhythm
        </p>
        <h2 className="mt-5 font-heading text-[clamp(3rem,5vw,5rem)] font-medium leading-[0.88] tracking-[-0.055em]">
          Less chasing.
          <br />
          More knowing.
        </h2>
        <div className="mt-10 grid grid-cols-2 border border-ink" role="group" aria-label="Compare ways of working">
          <button
            type="button"
            onClick={() => setMode("before")}
            aria-pressed={mode === "before"}
            className={`min-h-12 text-xs font-semibold ${
              mode === "before" ? "bg-cobalt text-white" : "hover:bg-cobalt-wash"
            }`}
          >
            Before
          </button>
          <button
            type="button"
            onClick={() => setMode("blubook")}
            aria-pressed={mode === "blubook"}
            className={`min-h-12 border-l border-ink text-xs font-semibold ${
              mode === "blubook" ? "bg-cobalt text-white" : "hover:bg-cobalt-wash"
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
                <span className="text-cobalt" aria-hidden="true">
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
