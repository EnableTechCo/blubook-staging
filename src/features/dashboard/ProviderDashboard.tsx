import Link from "next/link";
import type { ProviderDashboardData } from "@/services/dashboard";
import { BrandMark } from "@/components/ui/BrandMark";
import { Badge, Empty, Section, WorkspaceHeader } from "@/features/dashboard/ui";
import { acceptOffer, rejectOffer } from "@/features/requests/actions";
import { BusinessPulse } from "@/features/dashboard/BusinessPulse";

const actionButton =
  "inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] shadow-sm transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]";

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
    <div className="workspace-metric-cell border-b border-r">
      <p className={`workspace-metric-value ${accent ? "text-cobalt-deep" : "text-ink"}`} data-workspace-number>
        {value}
      </p>
      <p className="workspace-metric-label text-cobalt">{label}</p>
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
      <WorkspaceHeader
        eyebrow="Provider workspace"
        title={workspaceTitle(workGroups)}
        description="Review routed work and track the requests assigned to your work group."
        aside={
          provider ? (
            <div className="flex flex-wrap items-end gap-5">
              <aside
                aria-label="BluBook partner workspace"
                className="workspace-panel w-full sm:w-56"
              >
                <div className="flex h-24 items-center justify-center border-b border-ink/8 bg-white px-5 py-4">
                  <BrandMark />
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-ink/55">
                    Partner workspace
                  </span>
                  <Badge status={provider.status} />
                </div>
              </aside>
              <div className="border-l-2 border-cobalt/35 pl-3">
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink/50">
                  Partnership
                </p>
                <p
                  className={`font-mono text-[10px] font-semibold uppercase tracking-[0.1em] ${
                    provider.tier === "premium" ? "text-cobalt-deep" : "text-ink/55"
                  }`}
                >
                  {provider.tier === "premium" ? "Premium Partner" : "Standard Partner"}
                </p>
              </div>
            </div>
          ) : null
        }
      />

      <BusinessPulse
        eyebrow="Today’s service pulse"
        title="Know where your attention is needed"
        description="Offers need a response first; active requests and work groups give the context for how your service practice is moving."
        items={[
          {
            label: "Pending offers",
            value: offers.length,
            detail: "Awaiting your decision",
            tone: offers.length > 0 ? "attention" : "positive",
          },
          { label: "Active requests", value: active, detail: "Assigned or in progress" },
          { label: "Work groups", value: workGroups.length, detail: "Your routing network" },
        ]}
      />


      <div className="workspace-metric-band grid grid-cols-1 sm:grid-cols-3">
        <ProviderStat value={active} label="Active requests" />
        <ProviderStat value={offers.length} label="Pending offers" accent />
        <ProviderStat value={workGroups.length} label="Work groups" />
      </div>

      <Section title="Pending offers" subtitle="Requests routed to you awaiting your response">
        {offers.length === 0 ? (
          <Empty>No pending offers.</Empty>
        ) : (
          <ul className="divide-y divide-ink/8 overflow-hidden rounded-xl border border-ink/8">
            {offers.map((offer) => {
              const reference = offer.service_requests?.reference ?? "Offer";

              return (
                <li
                  key={offer.id}
                  className="grid gap-5 bg-cobalt-wash/45 px-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
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
