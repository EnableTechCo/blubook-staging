import type { RequestRow } from "@/services/dashboard";
import { Badge, Empty, formatDate } from "@/features/dashboard/ui";

export function RequestsTable({
  rows,
  showClient = false,
  showProvider = false,
}: {
  rows: RequestRow[];
  showClient?: boolean;
  showProvider?: boolean;
}) {
  if (rows.length === 0) return <Empty>No service requests yet.</Empty>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-4 font-medium">Reference</th>
            <th className="py-2 pr-4 font-medium">Title</th>
            <th className="py-2 pr-4 font-medium">Service</th>
            {showClient ? <th className="py-2 pr-4 font-medium">Client</th> : null}
            {showProvider ? <th className="py-2 pr-4 font-medium">Provider</th> : null}
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
              {showClient ? <td className="py-2 pr-4 text-slate-600">{r.clients?.business_name ?? "—"}</td> : null}
              {showProvider ? (
                <td className="py-2 pr-4 text-slate-600">{r.providers?.business_name ?? "Unassigned"}</td>
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
