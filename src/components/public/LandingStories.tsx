"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import { Eyebrow } from "@/components/ui/Editorial";

const stories = [
  {
    id: "administration",
    title: "The paperwork moves. You keep leading.",
    copy: "Recurring filings, compliance requirements, and administrative requests become visible work without asking you to coordinate every hand-off.",
    signal: "Compliance requirements remain visible",
    image: "/images/editorial/south-africa-operations-desk.jpg",
    alt: "A South African operations specialist coordinating documents at a shared worktable",
  },
  {
    id: "specialists",
    title: "The right capability, with the context intact.",
    copy: "BluBook Staff creates the request in the right service category and manages assignment through the existing provider workflow.",
    signal: "One brief follows the service request",
    image: "/images/editorial/south-africa-advisor-session.jpg",
    alt: "A South African business owner consulting with an operations advisor",
  },
  {
    id: "delivery",
    title: "Progress stays attached to the work.",
    copy: "Assigned providers update supported request statuses as work progresses, giving the dashboard a current operational record.",
    signal: "Request status remains traceable",
    image: "/images/editorial/south-africa-operations-hero.jpg",
    alt: "A South African business owner and operations specialist reviewing current work",
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
    <section id="what-we-do" className="scroll-mt-20 border-b border-ink/15 bg-paper">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-12 md:gap-8 md:py-24">
        <div className="md:col-span-5 md:pr-6">
          <Eyebrow>Work, seen as connected stories</Eyebrow>
          <h2 className="mt-6 max-w-[10ch] font-heading text-[2.75rem] font-normal leading-[1.02] tracking-[-0.04em] text-ink md:text-[3.75rem]">
            What BluBook helps move.
          </h2>
        </div>

        <div className="md:col-span-7">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream">
            <Image
              key={story.image}
              src={story.image}
              alt={story.alt}
              fill
              sizes="(min-width: 768px) 58vw, 100vw"
              className="object-cover"
            />
            <span className="absolute left-4 top-4 bg-sun px-3 py-2 font-body text-[9px] font-medium uppercase tracking-[0.18em] text-ink">
              In motion
            </span>
          </div>

          <div
            className="mt-8 divide-y divide-ink/15 border-y border-ink/15"
            role="tablist"
            aria-label="BluBook service stories"
          >
            {stories.map((item, index) => {
              const active = index === activeIndex;

              return (
                <div key={item.id} role="presentation">
                  <button
                    id={`story-tab-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls="story-panel"
                    tabIndex={active ? 0 : -1}
                    onClick={() => setActiveIndex(index)}
                    onKeyDown={(event) => handleTabKey(event, index)}
                    className="group flex w-full items-center justify-between gap-6 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-rust"
                  >
                    <span
                      className={`font-heading text-[1.35rem] font-normal leading-snug transition-colors ${
                        active ? "text-ink" : "text-ink/70 group-hover:text-rust"
                      }`}
                    >
                      {item.title}
                    </span>
                    <span
                      className={`shrink-0 font-body text-2xl font-light leading-none text-rust transition-transform ${
                        active ? "rotate-45" : ""
                      }`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>

                  {active ? (
                    <div
                      id="story-panel"
                      role="tabpanel"
                      aria-labelledby={`story-tab-${story.id}`}
                      className="pb-6 pr-8"
                    >
                      <p className="max-w-2xl font-body text-sm leading-relaxed text-ink/70">
                        {story.copy}
                      </p>
                      <p className="mt-4 font-body text-[10px] font-medium uppercase tracking-[0.16em] text-ink/50">
                        {story.signal}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
