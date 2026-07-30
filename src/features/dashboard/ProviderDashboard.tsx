import Link from "next/link";
import type { ProviderDashboardData } from "@/services/dashboard";
import { Badge, Empty, Section } from "@/features/dashboard/ui";
import { acceptOffer, rejectOffer } from "@/features/requests/actions";

const actionButton =
  "inline-flex min-h-10 items-center justify-center border px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors";

function ProviderStat({
  value,
  label,
  accent = false,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="min-h-32 border-b border-r border-ink bg-paper-light/70 p-4 sm:p-5">
      <p className={`font-heading text-4xl leading-none ${accent ? "text-clay" : "text-ink"}`}>
        {value}
      </p>
      <p className="mt-4 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
        {label}
      </p>
    </div>
  );
}

export function ProviderDashboard({ data }: { data: ProviderDashboardData }) {
  const { provider, capabilities, requests, offers } = data;
  const active = requests.filter(
    (request) => request.status === "assigned" || request.status === "in_progress",
  ).length;

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden border-y border-ink bg-cream px-5 py-8 sm:px-8 sm:py-10">
        <div className="absolute right-0 top-0 h-full w-2 bg-clay" aria-hidden="true" />
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cobalt">
              Provider workspace
            </p>
            <h1 className="mt-4 font-heading text-4xl font-medium leading-[0.95] tracking-[-0.035em] text-ink sm:text-5xl">
              {provider?.business_name ?? "Your business"}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-ink/65">
              Review routed work, track active requests, and keep your registered service
              capabilities in view.
            </p>
          </div>
          {provider ? (
            <div className="border-l-2 border-sun pl-3">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/50">
                Account standing
              </p>
              <Badge status={provider.status} />
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-1 border-l border-t border-ink sm:grid-cols-3">
        <ProviderStat value={active} label="Active requests" />
        <ProviderStat value={offers.length} label="Pending offers" accent />
        <ProviderStat value={capabilities.length} label="Capabilities" />
      </div>

      <Section title="Pending offers" subtitle="Requests routed to you awaiting your response">
        {offers.length === 0 ? (
          <Empty>No pending offers.</Empty>
        ) : (
          <ul className="divide-y divide-ink border-y border-ink">
            {offers.map((offer, index) => {
              const reference = offer.service_requests?.reference ?? "Offer";

              return (
                <li
                  key={offer.id}
                  className="grid gap-5 bg-sun/10 px-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="flex min-w-0 gap-4">
                    <span
                      className="font-heading text-3xl leading-none text-clay"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      {offer.service_requests?.id ? (
                        <Link
                          href={`/dashboard/transact/requests/${offer.service_requests.id}`}
                          className="group block"
                        >
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-cobalt group-hover:text-cobalt-deep">
                            {reference}
                          </span>
                          <span className="mt-1 block text-sm font-medium leading-5 text-ink group-hover:text-cobalt">
                            {offer.service_requests.title}
                          </span>
                          <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/50 group-hover:text-cobalt">
                            View information and files →
                          </span>
                        </Link>
                      ) : (
                        <>
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-cobalt">
                            {reference}
                          </p>
                          <p className="mt-1 text-sm font-medium leading-5 text-ink">
                            {offer.service_requests?.title ?? "Request details unavailable"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <form action={acceptOffer}>
                      <input type="hidden" name="assignmentId" value={offer.id} />
                      <button
                        type="submit"
                        aria-label={`Accept offer ${reference}`}
                        className={`${actionButton} border-clay bg-clay text-paper hover:border-ink hover:bg-ink`}
                      >
                        Accept
                      </button>
                    </form>
                    <form action={rejectOffer}>
                      <input type="hidden" name="assignmentId" value={offer.id} />
                      <button
                        type="submit"
                        aria-label={`Reject offer ${reference}`}
                        className={`${actionButton} border-ink/45 bg-paper-light text-ink hover:border-ink hover:bg-ink hover:text-paper`}
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Capabilities" subtitle="Services you are registered to deliver">
        {capabilities.length === 0 ? (
          <Empty>No capabilities registered.</Empty>
        ) : (
          <ul className="grid border-l border-t border-ink sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability, index) => (
              <li
                key={index}
                className={`flex min-h-20 items-center justify-between gap-4 border-b border-r border-ink px-4 py-3 ${
                  capability.active ? "bg-paper-light/50 text-ink" : "bg-cream/60 text-ink/45"
                }`}
              >
                <span className={`text-sm font-medium ${capability.active ? "" : "line-through"}`}>
                  {capability.services?.name ?? "Service"}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em]">
                  {capability.active ? "Active" : "Inactive"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
