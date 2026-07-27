"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";

const stories = [
  {
    id: "administration",
    title: "The paperwork moves. You keep leading.",
    copy: "Recurring filings, compliance requirements, and administrative requests become visible work without asking you to coordinate every hand-off.",
    signal: "Compliance requirements remain visible",
    image: "/images/landing/operations-desk.jpg",
    alt: "Business documents being coordinated around a shared worktable",
  },
  {
    id: "specialists",
    title: "The right capability, with the context intact.",
    copy: "BluBook Staff creates the request in the right service category and manages assignment through the existing provider workflow.",
    signal: "One brief follows the service request",
    image: "/images/landing/advisor-consultation.jpg",
    alt: "A business owner consulting with an operations specialist",
  },
  {
    id: "delivery",
    title: "Progress stays attached to the work.",
    copy: "Assigned providers update supported request statuses as work progresses, giving the dashboard a current operational record.",
    signal: "Request status remains traceable",
    image: "/images/landing/hero-team.jpg",
    alt: "A business team reviewing current work together",
  },
];

export function LandingStories() {
  const [activeIndex, setActiveIndex] = useState(0);
  const story = stories[activeIndex];

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % stories.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + stories.length) % stories.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = stories.length - 1;

    if (nextIndex === null) return;

    event.preventDefault();
    setActiveIndex(nextIndex);
    document.getElementById(`story-tab-${stories[nextIndex].id}`)?.focus();
  }

  return (
    <section id="what-we-do" className="grid scroll-mt-20 border-y border-ink lg:grid-cols-[0.85fr_1.15fr]">
      <div className="bg-paper-light px-5 py-16 sm:px-10 lg:px-[7vw] lg:py-24">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
          Work, seen as connected stories
        </p>
        <h2 className="mt-5 max-w-[10ch] font-heading text-[clamp(3rem,5vw,5.2rem)] font-medium leading-[0.9] tracking-[-0.055em]">
          What BluBook helps move.
        </h2>
        <div className="mt-12" role="tablist" aria-label="BluBook service stories">
          {stories.map((item, index) => (
            <button
              key={item.id}
              id={`story-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-controls="story-panel"
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => handleTabKey(event, index)}
              className={`grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-ink/25 px-3 py-5 text-left font-heading text-lg transition-colors ${
                index === activeIndex
                  ? "bg-cobalt-wash text-cobalt"
                  : "hover:bg-paper hover:text-cobalt"
              }`}
            >
              <span>{item.title}</span>
              <span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </div>

      <article
        id="story-panel"
        role="tabpanel"
        aria-labelledby={`story-tab-${story.id}`}
        className="bg-cobalt p-5 text-white sm:p-8 lg:p-10"
      >
        <div className="relative min-h-[24rem] overflow-hidden border border-white/25 sm:min-h-[34rem]">
          <Image
            key={story.image}
            src={story.image}
            alt={story.alt}
            fill
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="grid gap-8 border-t border-white/35 py-8 md:grid-cols-[1fr_auto] md:items-end">
          <p className="max-w-2xl font-heading text-2xl leading-snug sm:text-3xl">{story.copy}</p>
          <p className="border-t border-white/50 pt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-white/80">
            ○ {story.signal}
          </p>
        </div>
      </article>
    </section>
  );
}
