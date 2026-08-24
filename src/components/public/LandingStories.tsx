import Image from "next/image";

const stories = [
  {
    category: "Administration",
    title: "The paperwork moves. You keep leading.",
    copy: "Recurring filings, compliance requirements, and administrative requests become visible work without asking you to coordinate every hand-off.",
    signal: "Compliance requirements remain visible",
    image: "/images/editorial/south-africa-operations-desk.jpg",
    alt: "A South African operations specialist coordinating documents at a shared worktable",
  },
  {
    category: "Specialist support",
    title: "The right capability, with the context intact.",
    copy: "BluBook Staff creates the request in the right service category and manages assignment through the existing provider workflow.",
    signal: "One brief follows the service request",
    image: "/images/editorial/south-africa-advisor-session.jpg",
    alt: "A South African business owner consulting with an operations advisor",
  },
  {
    category: "Delivery",
    title: "Progress stays attached to the work.",
    copy: "Assigned providers update supported request statuses as work progresses, giving the dashboard a current operational record.",
    signal: "Request status remains traceable",
    image: "/images/editorial/south-africa-operations-hero.jpg",
    alt: "A South African business owner and operations specialist reviewing current work",
  },
];

export function LandingStories() {
  return (
    <section id="insights" className="scroll-mt-20 bg-paper py-20 md:py-24">
      <div className="mx-auto max-w-[1150px] px-5 lg:px-7">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:items-end" data-motion-reveal>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cobalt">From the operating desk</p>
            <h2 className="mt-4 max-w-[24ch] font-body text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink">
              Practical clarity for work that has to move.
            </h2>
            <span className="public-section-accent mt-6" aria-hidden="true" />
          </div>
          <p className="max-w-xl text-[15px] leading-7 text-ink/65 md:justify-self-end">
            A view into the operating principles behind BluBook: visible requirements,
            intact context, and progress that stays connected to the request.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3" data-motion-reveal-group>
          {stories.map((story) => (
            <article
              key={story.title}
              className="flex min-h-full flex-col overflow-hidden rounded-[5px] bg-white shadow-[0_12px_30px_rgba(25,61,110,0.08)]"
              data-motion-card
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-cream">
                <Image
                  src={story.image}
                  alt={story.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cobalt">
                  {story.category}
                </p>
                <h3 className="mt-4 font-heading text-[1.65rem] font-normal leading-[1.08] text-ink">
                  {story.title}
                </h3>
                <p className="mt-4 text-[13px] leading-6 text-ink/62">{story.copy}</p>
                <p className="mt-8 border-t border-ink/10 pt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-ink/48">
                  {story.signal}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
