import type { StaffDashboardData } from "@/services/dashboard";
import { Badge, Empty, Section, Stat, titleCase } from "@/features/dashboard/ui";
import { RequestsTable } from "@/features/dashboard/RequestsTable";

export function StaffDashboard({ data }: { data: StaffDashboardData }) {
  const { counts, requests, providers, services } = data;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-sky-700">Operations</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">BluBook control desk</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Clients" value={counts.clients} />
        <Stat label="Providers" value={counts.providers} />
        <Stat label="Services" value={counts.services} />
        <Stat label="Open requests" value={counts.openRequests} />
        <Stat label="Awaiting assignment" value={counts.awaitingAssignment} tone="amber" />
      </div>

      <Section title="Recent requests" subtitle="Latest service requests across all clients and providers">
        <RequestsTable rows={requests} showClient showProvider />
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Providers" subtitle="Registered service providers">
          {providers.length === 0 ? (
            <Empty>No providers registered.</Empty>
          ) : (
            <ul className="space-y-1">
              {providers.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{p.business_name}</span>
                  <Badge status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Service catalogue" subtitle="Services and their standard turnaround">
          {services.length === 0 ? (
            <Empty>No services defined.</Empty>
          ) : (
            <ul className="space-y-1">
              {services.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">
                    {s.name}
                    {!s.active ? <span className="ml-2 text-xs text-slate-400">(inactive)</span> : null}
                  </span>
                  <span className="text-xs text-slate-500">
                    {s.default_turnaround_days ? `${s.default_turnaround_days}-day ETA` : "no SLA"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
