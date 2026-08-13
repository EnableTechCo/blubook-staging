import Link from "next/link";
import type { ProviderDashboardData } from "@/services/dashboard";
import { BrandMark } from "@/components/ui/BrandMark";
import { Badge, Empty, Section } from "@/features/dashboard/ui";
import { acceptOffer, rejectOffer } from "@/features/requests/actions";

const actionButton =
  "inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] shadow-sm transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]";

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
    <div className="min-h-32 border-b border-r border-ink/8 bg-paper-light/70 p-4 sm:p-5">
      <p className={`font-heading text-4xl leading-none ${accent ? "text-clay" : "text-ink"}`}>
        {value}
      </p>
      <p className="mt-4 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
        {label}
      </p>
    </div>
  );
}

// A partner works as a member of a work group rather than under its own
// banner, so the group is what the workspace is headed with. A partner in
// several is headed with all of them: the groups are what its work arrives
// through, and naming only the first would misdescribe the account.
function workspaceTitle(groups: ProviderDashboardData["workGroups"]): string {
  return groups.length > 0
    ? groups.map((group) => group.name).join(" · ")
    : "Awaiting a work group";
}

export function ProviderDashboard({ data }: { data: ProviderDashboardData }) {
  const { provider, workGroups, requests, offers } = data;
  const active = requests.filter(
    (request) => request.status === "assigned" || request.status === "in_progress",
  ).length;

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/75 px-5 py-8 shadow-surface sm:px-8 sm:py-10">
        <div className="absolute right-0 top-0 h-full w-1.5 bg-cobalt" aria-hidden="true" />
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cobalt">
              Provider workspace
            </p>
            <h1 className="mt-4 font-heading text-4xl font-medium leading-[0.95] tracking-[-0.035em] text-ink sm:text-5xl">
              {workspaceTitle(workGroups)}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-ink/65">
              Review routed work and track the requests assigned to your work group.
            </p>
          </div>
          {provider ? (
            <div className="flex flex-wrap items-end gap-6">
              {/* The client workspace is headed with the client's own artwork.
                  A partner's is headed with BluBook's, because that is whose
                  name the work is delivered under. */}
              <aside
                aria-label="BluBook partner workspace"
                className="w-full overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/85 shadow-sm sm:w-56"
              >
                <div className="flex h-28 items-center justify-center border-b border-ink/8 bg-paper-light px-5 py-4">
                  <BrandMark />
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-ink/55">
                    Partner workspace
                  </span>
                  <Badge status={provider.status} />
                </div>
              </aside>

              {/* The tier is a property of this practice, not of the groups it
                  works in: a premium partner is premium everywhere it delivers.
                  Staff set it; the partner sees where it stands. */}
              <div className="border-l-2 border-sun pl-3">
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/50">
                  Partnership
                </p>
                <p
                  className={`font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    provider.tier === "premium" ? "text-clay" : "text-ink/55"
                  }`}
                >
                  {provider.tier === "premium" ? "Premium Partner" : "Standard Partner"}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/60 shadow-surface sm:grid-cols-3">
        <ProviderStat value={active} label="Active requests" />
        <ProviderStat value={offers.length} label="Pending offers" accent />
        <ProviderStat value={workGroups.length} label="Work groups" />
      </div>

      <Section title="Pending offers" subtitle="Requests routed to you awaiting your response">
        {offers.length === 0 ? (
          <Empty>No pending offers.</Empty>
        ) : (
          <ul className="divide-y divide-ink/8 overflow-hidden rounded-xl border border-ink/8">
            {offers.map((offer, index) => {
              const reference = offer.service_requests?.reference ?? "Offer";

              return (
                <li
                  key={offer.id}
                  className="grid gap-5 bg-cobalt-wash/45 px-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
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
                          href={`/dashboard/reports/requests/${offer.service_requests.id}`}
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

      <Section
        title="Work groups"
        subtitle="Requests reach you through the groups you belong to"
      >
        {workGroups.length === 0 ? (
          <Empty>
            You are not in a work group yet, so no requests will be routed to you. Your BluBook
            contact can add you to one.
          </Empty>
        ) : (
          <ul className="grid overflow-hidden rounded-xl border border-ink/8 sm:grid-cols-2 lg:grid-cols-3">
            {workGroups.map((group) => (
              <li
                key={group.id}
                className="flex min-h-20 items-center justify-between gap-4 border-b border-r border-ink/8 bg-paper-light/65 px-4 py-3"
              >
                <span className="text-sm font-medium text-ink">{group.name}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink/55">
                  Member
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

    </div>
  );
}
