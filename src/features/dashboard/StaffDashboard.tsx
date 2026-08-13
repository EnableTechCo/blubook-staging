import Link from "next/link";
import type { StaffDashboardData } from "@/services/dashboard";
import { RequestsTable } from "@/features/dashboard/RequestsTable";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { buttonStyles } from "@/components/ui/Button";

const number = new Intl.NumberFormat("en-ZA");

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-ink/20 bg-cobalt-wash/40 px-4 py-8 text-center text-sm text-ink/55">
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
    <section className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/78 shadow-surface">
      <header className="border-b border-ink/8 bg-paper-light/55 px-5 py-4 sm:flex sm:items-end sm:justify-between">
        <h2 className="font-heading text-2xl leading-none">{title}</h2>
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-ink/55 sm:mt-0">
          {eyebrow}
        </p>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
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
      <header className="border-b border-ink/10 pb-7 lg:flex lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cobalt">
            Operations / Network overview
          </p>
          <h1 className="mt-3 font-heading text-[clamp(2.25rem,4vw,3.25rem)] leading-[0.98] tracking-[-0.035em]">
            BluBook control desk
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-ink/65">
            Track the service network, review current demand and move new businesses from intake
            to active client.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row lg:mt-0">
          <Link href="/dashboard/onboardings" className={buttonStyles({ variant: "secondary" })}>
            Review onboardings
          </Link>
          <Link href="/dashboard/onboard" className={buttonStyles()}>
            Onboard a client
          </Link>
        </div>
      </header>

      <section aria-labelledby="network-summary">
        <h2 id="network-summary" className="sr-only">
          Network summary
        </h2>
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/70 shadow-surface md:grid-cols-5">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={`min-h-32 border-b border-r border-ink/8 p-4 sm:p-5 ${
                metric.urgent ? "bg-sun/20" : index % 2 ? "bg-cobalt-wash/35" : "bg-paper-light/75"
              }`}
            >
              <strong className="block font-heading text-4xl font-normal leading-none sm:text-5xl">
                {number.format(metric.value)}
              </strong>
              <span className="mt-5 block max-w-28 font-mono text-[9px] font-semibold uppercase leading-4 tracking-[0.09em] text-ink/60">
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
