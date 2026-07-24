import type { ProviderDashboardData, RequestRow } from "@/services/dashboard";
import { Badge, Empty, Section } from "@/features/dashboard/ui";
import { RequestsTable } from "@/features/dashboard/RequestsTable";
import { acceptOffer, rejectOffer, setRequestStatus } from "@/features/requests/actions";

const actionBtn = "rounded-md px-2.5 py-1 text-xs font-medium";

export function ProviderDashboard({ data }: { data: ProviderDashboardData }) {
  const { provider, capabilities, requests, offers } = data;
  const active = requests.filter((r) => r.status === "assigned" || r.status === "in_progress").length;

  // Complete / cancel controls for requests the provider is actively working.
  const requestActions = (r: RequestRow) => {
    if (r.status !== "in_progress") return <span className="text-xs text-slate-400">—</span>;
    return (
      <span className="flex gap-2">
        <form action={setRequestStatus}>
          <input type="hidden" name="requestId" value={r.id} />
          <input type="hidden" name="status" value="completed" />
          <button type="submit" className={`${actionBtn} bg-emerald-600 text-white hover:bg-emerald-700`}>
            Complete
          </button>
        </form>
        <form action={setRequestStatus}>
          <input type="hidden" name="requestId" value={r.id} />
          <input type="hidden" name="status" value="cancelled" />
          <button type="submit" className={`${actionBtn} border border-slate-300 text-slate-700 hover:bg-slate-50`}>
            Cancel
          </button>
        </form>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-700">Provider workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{provider?.business_name ?? "Your business"}</h1>
        </div>
        {provider ? <Badge status={provider.status} /> : null}
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-slate-900">{active}</div>
          <div className="mt-1 text-xs text-slate-500">Active requests</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-amber-600">{offers.length}</div>
          <div className="mt-1 text-xs text-slate-500">Pending offers</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-slate-900">{capabilities.length}</div>
          <div className="mt-1 text-xs text-slate-500">Capabilities</div>
        </div>
      </div>

      <Section title="Pending offers" subtitle="Requests routed to you awaiting your response">
        {offers.length === 0 ? (
          <Empty>No pending offers.</Empty>
        ) : (
          <ul className="space-y-2">
            {offers.map((o) => (
              <li key={o.id} className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                <span>
                  <span className="font-mono text-xs text-slate-600">{o.service_requests?.reference}</span>{" "}
                  {o.service_requests?.title}
                </span>
                <span className="flex gap-2">
                  <form action={acceptOffer}>
                    <input type="hidden" name="assignmentId" value={o.id} />
                    <button type="submit" className={`${actionBtn} bg-sky-700 text-white hover:bg-sky-800`}>
                      Accept
                    </button>
                  </form>
                  <form action={rejectOffer}>
                    <input type="hidden" name="assignmentId" value={o.id} />
                    <button type="submit" className={`${actionBtn} border border-slate-300 text-slate-700 hover:bg-white`}>
                      Reject
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Capabilities" subtitle="Services you are registered to deliver">
        {capabilities.length === 0 ? (
          <Empty>No capabilities registered.</Empty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {capabilities.map((c, i) => (
              <span
                key={i}
                className={`rounded-full border px-3 py-1 text-xs ${c.active ? "border-slate-300 text-slate-700" : "border-slate-200 text-slate-400 line-through"}`}
              >
                {c.services?.name ?? "Service"}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Your requests" subtitle="Requests assigned to you or that you raised">
        <RequestsTable rows={requests} showClientRef renderActions={requestActions} />
      </Section>
    </div>
  );
}
