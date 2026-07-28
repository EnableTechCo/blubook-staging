import type { ReactNode } from "react";
import type { RequestRow } from "@/services/dashboard";
import { Badge, Empty, formatDate } from "@/features/dashboard/ui";

function anonRef(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
}

export function RequestsTable({
  rows,
  showClientName = false,
  showClientRef = false,
  showProviderName = false,
  showProviderStatus = false,
  renderActions,
}: {
  rows: RequestRow[];
  showClientName?: boolean;
  showClientRef?: boolean;
  showProviderName?: boolean;
  showProviderStatus?: boolean;
  renderActions?: (row: RequestRow) => ReactNode;
}) {
  if (rows.length === 0) return <Empty>No service requests yet.</Empty>;

  const showClientCol = showClientName || showClientRef;
  const showProviderCol = showProviderName || showProviderStatus;

  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-y border-ink/60 bg-cream/60 text-[9px] uppercase tracking-[0.16em] text-ink/60">
            <th className="px-5 py-3 font-medium sm:pl-6">Reference</th>
            <th className="px-3 py-3 font-medium">Title</th>
            <th className="px-3 py-3 font-medium">Service</th>
            {showClientCol ? <th className="px-3 py-3 font-medium">Client</th> : null}
            {showProviderCol ? <th className="px-3 py-3 font-medium">Provider</th> : null}
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">ETA</th>
            {renderActions ? <th className="px-3 py-3 pr-5 font-medium sm:pr-6">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((request) => (
            <tr key={request.id} className="border-b border-ink/45 align-middle last:border-b-0">
              <td className="px-5 py-4 font-mono text-[11px] text-rust sm:pl-6">
                {request.reference}
              </td>
              <td className="max-w-52 px-3 py-4 font-medium text-ink">{request.title}</td>
              <td className="px-3 py-4 text-ink/60">{request.services?.name ?? "—"}</td>
              {showClientCol ? (
                <td className="px-3 py-4 text-ink/60">
                  {showClientName
                    ? request.clients?.business_name ?? "—"
                    : anonRef("Client", request.client_id)}
                </td>
              ) : null}
              {showProviderCol ? (
                <td className="px-3 py-4 text-ink/60">
                  {showProviderName
                    ? request.providers?.business_name ?? "Unassigned"
                    : request.provider_id
                      ? "Assigned"
                      : "Unassigned"}
                </td>
              ) : null}
              <td className="px-3 py-4">
                <Badge status={request.status} />
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-ink/60">
                {formatDate(request.request_schedules?.due_at)}
              </td>
              {renderActions ? (
                <td className="px-3 py-4 pr-5 sm:pr-6">{renderActions(request)}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
