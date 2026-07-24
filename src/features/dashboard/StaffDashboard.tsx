import Link from "next/link";
import type { StaffDashboardData } from "@/services/dashboard";
import { Badge, Empty, Section, Stat, titleCase } from "@/features/dashboard/ui";
import { RequestsTable } from "@/features/dashboard/RequestsTable";

export function StaffDashboard({ data }: { data: StaffDashboardData }) {
  const { counts, requests, clients, providers, services } = data;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-700">Operations</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">BluBook control desk</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/onboardings"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Onboardings
          </Link>
          <Link
            href="/dashboard/onboard"
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
          >
            Onboard a client
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Clients" value={counts.clients} />
        <Stat label="Providers" value={counts.providers} />
        <Stat label="Services" value={counts.services} />
        <Stat label="Open requests" value={counts.openRequests} />
        <Stat label="Awaiting assignment" value={counts.awaitingAssignment} tone="amber" />
      </div>

      <Section title="Recent requests" subtitle="Latest service requests across all clients and providers">
        <RequestsTable rows={requests} showClientName showProviderName />
      </Section>

      <Section title="Clients" subtitle="Onboarded client businesses">
        {clients.length === 0 ? (
          <Empty>No clients yet. Use “Onboard a client” to add one.</Empty>
        ) : (
          <ul className="space-y-1">
            {clients.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{c.business_name}</span>
                <Badge status={c.status} />
              </li>
            ))}
          </ul>
        )}
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
