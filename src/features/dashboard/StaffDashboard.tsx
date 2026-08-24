import Link from "next/link";
import type { StaffDashboardData } from "@/services/dashboard";
import { RequestsTable } from "@/features/dashboard/RequestsTable";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { buttonStyles } from "@/components/ui/Button";
import { WorkspaceHeader } from "@/features/dashboard/ui";

const number = new Intl.NumberFormat("en-ZA");

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="workspace-empty px-4 py-8 text-center text-sm">
      {children}
    </p>
  );
}

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="workspace-panel">
      <header className="workspace-panel-header">
        <h2 className="workspace-panel-title">{title}</h2>
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink/55">
          {eyebrow}
        </p>
      </header>
      <div className="workspace-panel-body">{children}</div>
    </section>
  );
}

export function StaffDashboard({ data }: { data: StaffDashboardData }) {
  const { counts, requests, clients, providers, services } = data;
  const metrics = [
    { label: "Clients", value: counts.clients },
    { label: "Providers", value: counts.providers },
    { label: "Services", value: counts.services },
    { label: "Live requests", value: counts.openRequests },
    { label: "Awaiting assignment", value: counts.awaitingAssignment, urgent: true },
  ];

  return (
    <div className="mx-auto max-w-[92rem] space-y-7">
      <WorkspaceHeader
        eyebrow="Operations / Network overview"
        title="BluBook control desk"
        description="Track the service network, review current demand and move new businesses from intake to active client."
        aside={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/dashboard/onboardings" className={buttonStyles({ variant: "secondary" })}>
              Review onboardings
            </Link>
            <Link href="/dashboard/onboard" className={buttonStyles()}>
              Onboard a client
            </Link>
          </div>
        }
      />

      <section aria-labelledby="network-summary">
        <h2 id="network-summary" className="sr-only">
          Network summary
        </h2>
        <div className="workspace-metric-band grid grid-cols-2 md:grid-cols-5">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={`workspace-metric-cell border-b border-r ${
                metric.urgent ? "bg-cobalt-wash/55" : index % 2 ? "bg-paper-light/30" : ""
              }`}
            >
              <strong className={`workspace-metric-value block ${metric.urgent ? "text-cobalt-deep" : ""}`} data-workspace-number>
                {number.format(metric.value)}
              </strong>
              <span className="workspace-metric-label block max-w-28">
                {metric.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Panel title="Recent requests" eyebrow={`${requests.length} latest records`}>
        <RequestsTable rows={requests} view="staff" />
      </Panel>

      <div className="grid gap-7 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Client register" eyebrow={`${clients.length} businesses`}>
          {clients.length === 0 ? (
            <EmptyState>No clients yet. Use “Onboard a client” to add one.</EmptyState>
          ) : (
            <ul className="divide-y divide-ink/8">
              {clients.map((client) => (
                <li key={client.id} className="flex items-center justify-between gap-4 py-3.5">
                  <span className="min-w-0 truncate text-sm font-medium">{client.business_name}</span>
                  <StatusLabel status={client.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Provider register" eyebrow={`${providers.length} practices`}>
          {providers.length === 0 ? (
            <EmptyState>No providers registered.</EmptyState>
          ) : (
            <ul className="divide-y divide-ink/8">
              {providers.map((provider) => (
                <li key={provider.id} className="flex items-center justify-between gap-4 py-3.5">
                  <span className="min-w-0 truncate text-sm font-medium">
                    {provider.business_name}
                  </span>
                  <StatusLabel status={provider.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Service catalogue" eyebrow={`${services.length} service lines`}>
        {services.length === 0 ? (
          <EmptyState>No services defined.</EmptyState>
        ) : (
          <ul className="grid overflow-hidden rounded-xl border border-ink/8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex min-h-24 flex-col justify-between border-b border-r border-ink/8 bg-cobalt-wash/25 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold">{service.name}</span>
                  {!service.active ? <StatusLabel status="inactive" /> : null}
                </div>
                <span className="mt-5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink/55">
                  {service.default_turnaround_days
                    ? `${service.default_turnaround_days}-day ETA`
                    : "No SLA recorded"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
