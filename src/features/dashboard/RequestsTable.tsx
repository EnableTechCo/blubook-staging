import type { RequestRow } from "@/services/dashboard";
import { Badge, Empty, formatDate } from "@/features/dashboard/ui";

// A short, non-identifying reference derived from an id, so a party can tell
// counterparties apart without learning who they are.
function anonRef(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
}

export function RequestsTable({
  rows,
  // Client and provider are anonymous to each other; staff (the intermediary)
  // sees real names.
  showClientName = false, // staff: real client name
  showClientRef = false, // provider: anonymised client reference
  showProviderName = false, // staff: real provider name
  showProviderStatus = false, // client: assigned / unassigned only
}: {
  rows: RequestRow[];
  showClientName?: boolean;
  showClientRef?: boolean;
  showProviderName?: boolean;
  showProviderStatus?: boolean;
}) {
  if (rows.length === 0) return <Empty>No service requests yet.</Empty>;

  const showClientCol = showClientName || showClientRef;
  const showProviderCol = showProviderName || showProviderStatus;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-4 font-medium">Reference</th>
            <th className="py-2 pr-4 font-medium">Title</th>
            <th className="py-2 pr-4 font-medium">Service</th>
            {showClientCol ? <th className="py-2 pr-4 font-medium">Client</th> : null}
            {showProviderCol ? <th className="py-2 pr-4 font-medium">Provider</th> : null}
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">ETA</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-100 last:border-0">
              <td className="py-2 pr-4 font-mono text-xs text-slate-700">{r.reference}</td>
              <td className="py-2 pr-4">{r.title}</td>
              <td className="py-2 pr-4 text-slate-600">{r.services?.name ?? "—"}</td>
              {showClientCol ? (
                <td className="py-2 pr-4 text-slate-600">
                  {showClientName ? r.clients?.business_name ?? "—" : anonRef("Client", r.client_id)}
                </td>
              ) : null}
              {showProviderCol ? (
                <td className="py-2 pr-4 text-slate-600">
                  {showProviderName
                    ? r.providers?.business_name ?? "Unassigned"
                    : r.provider_id
                      ? "Assigned"
                      : "Unassigned"}
                </td>
              ) : null}
              <td className="py-2 pr-4">
                <Badge status={r.status} />
              </td>
              <td className="py-2 pr-4 text-slate-600">{formatDate(r.request_schedules?.due_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
