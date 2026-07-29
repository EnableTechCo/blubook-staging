import type { ReactNode } from "react";
import type { RequestRow } from "@/services/dashboard";
import { Badge, Empty, formatDate, titleCase } from "@/features/dashboard/ui";

type RequestTableView = "client" | "provider" | "staff";

function anonRef(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fiscalPeriod(value: string | null | undefined): string {
  if (!value) return "—";
  const source = new Date(value);
  if (Number.isNaN(source.getTime())) return "—";

  const date = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth(), source.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const fiscalYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(fiscalYear, 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  const quarter = Math.floor(source.getUTCMonth() / 3) + 1;

  return `${fiscalYear}-W${String(week).padStart(2, "0")} · Q${quarter} · FY${fiscalYear}`;
}

function serviceStartedAt(request: RequestRow): string | null {
  return (
    request.request_events
      ?.filter((event) => event.to_status === "in_progress")
      .sort((left, right) => left.created_at.localeCompare(right.created_at))[0]?.created_at ?? null
  );
}

function latestComment(request: RequestRow): { count: number; body: string } | null {
  const messages = request.request_messages ?? [];
  if (messages.length === 0) return null;
  const latest = [...messages].sort((left, right) =>
    right.created_at.localeCompare(left.created_at),
  )[0];
  return { count: messages.length, body: latest.body };
}

function windowResult(request: RequestRow): { label: string; hours: string } {
  const dueAt = request.request_schedules?.due_at;
  const completedAt = request.completed_at;
  if (!dueAt || !completedAt) {
    return {
      label: dueAt && request.status !== "completed" ? "Open" : "—",
      hours: "—",
    };
  }

  const due = new Date(dueAt);
  const completed = new Date(completedAt);
  const variance = (completed.getTime() - due.getTime()) / 3_600_000;
  if (!Number.isFinite(variance)) return { label: "—", hours: "—" };
  if (Math.abs(variance) < 0.01) return { label: "On time", hours: "0.0" };

  const sameDay = due.toDateString() === completed.toDateString();
  const size = Math.abs(variance) >= 4 ? "4+ hrs" : "Under 4 hrs";
  const direction = variance > 0 ? "late" : "early";
  return {
    label: `${sameDay ? "Same day" : "Different day"} · ${size} ${direction}`,
    hours: variance.toFixed(1),
  };
}

function resolverLabel(request: RequestRow, view: RequestTableView): string {
  if (!request.provider_id) return "Routing queue";
  if (view === "staff") return request.providers?.business_name ?? "Assigned provider";
  if (view === "provider") return "Your team";
  return "Assigned";
}

function clientLabel(request: RequestRow, view: RequestTableView): string {
  if (view === "staff") {
    return request.clients?.external_reference ?? request.clients?.business_name ?? "—";
  }
  return anonRef("Client", request.client_id);
}

export function RequestsTable({
  rows,
  view,
  renderActions,
}: {
  rows: RequestRow[];
  view: RequestTableView;
  renderActions?: (row: RequestRow) => ReactNode;
}) {
  if (rows.length === 0) return <Empty>No service requests yet.</Empty>;

  const showClient = view !== "client";

  return (
    <div className="-mx-5 sm:-mx-6">
      <p className="px-5 pb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink/55 sm:px-6">
        Scroll horizontally to view all SR operational fields
      </p>
      <div
        aria-label="Service request operations table"
        className="max-w-full overflow-x-auto overscroll-x-contain pb-2 [scrollbar-gutter:stable]"
        role="region"
        tabIndex={0}
      >
        <table className="w-max min-w-[2360px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-y border-ink bg-cream/60 text-[9px] uppercase tracking-[0.13em] text-ink/65">
              <th className="sticky left-0 z-20 min-w-36 bg-cream px-5 py-3 font-medium sm:pl-6">
                SR number
              </th>
              <th className="min-w-32 px-3 py-3 font-medium">Status</th>
              {showClient ? <th className="min-w-40 px-3 py-3 font-medium">Cust number</th> : null}
              <th className="min-w-28 px-3 py-3 font-medium">Request type</th>
              <th className="min-w-56 px-3 py-3 font-medium">Title</th>
              <th className="min-w-40 px-3 py-3 font-medium">Service</th>
              <th className="min-w-36 px-3 py-3 font-medium">Work group</th>
              <th className="min-w-24 px-3 py-3 font-medium">Source</th>
              <th className="min-w-40 px-3 py-3 font-medium">Resolver</th>
              <th className="min-w-36 px-3 py-3 font-medium">Partner WO</th>
              <th className="min-w-36 px-3 py-3 font-medium">SLA start</th>
              <th className="min-w-28 px-3 py-3 font-medium">SLA end</th>
              <th className="min-w-20 px-3 py-3 font-medium">SLA</th>
              <th className="min-w-28 px-3 py-3 font-medium">Service start</th>
              <th className="min-w-28 px-3 py-3 font-medium">Service end</th>
              <th className="min-w-52 px-3 py-3 font-medium">Window result</th>
              <th className="min-w-28 px-3 py-3 font-medium">Variance hrs</th>
              <th className="min-w-52 px-3 py-3 font-medium">Created fiscal</th>
              <th className="min-w-52 px-3 py-3 font-medium">Closed fiscal</th>
              <th className="min-w-40 px-3 py-3 font-medium">Last updated</th>
              <th className="min-w-64 px-3 py-3 font-medium">Comments</th>
              {renderActions ? <th className="min-w-48 px-3 py-3 pr-5 font-medium sm:pr-6">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((request) => {
              const startedAt = serviceStartedAt(request);
              const window = windowResult(request);
              const comment = latestComment(request);

              return (
                <tr key={request.id} className="border-b border-ink align-middle last:border-b-0">
                  <td className="sticky left-0 z-10 bg-paper px-5 py-4 font-mono text-[11px] text-rust sm:pl-6">
                    {request.reference}
                  </td>
                  <td className="px-3 py-4">
                    <Badge status={request.status} />
                  </td>
                  {showClient ? (
                    <td className="px-3 py-4 text-ink/65">{clientLabel(request, view)}</td>
                  ) : null}
                  <td className="px-3 py-4 text-ink/65">
                    {titleCase(request.request_type ?? "general")}
                  </td>
                  <td className="max-w-64 px-3 py-4 font-medium text-ink">{request.title}</td>
                  <td className="px-3 py-4 text-ink/65">{request.services?.name ?? "—"}</td>
                  <td className="px-3 py-4 text-ink/65">
                    {request.services?.service_groups?.name ?? request.services?.name ?? "—"}
                  </td>
                  <td className="px-3 py-4 text-ink/65">
                    {request.origin === "system" ? "System" : "Direct"}
                  </td>
                  <td className="px-3 py-4 text-ink/65">{resolverLabel(request, view)}</td>
                  <td className="px-3 py-4 font-mono text-[11px] text-ink/65">
                    {request.partner_work_order_reference ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-ink/65">
                    {formatDateTime(request.request_schedules?.sla_started_at ?? request.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-ink/65">
                    {formatDate(request.request_schedules?.due_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-ink/65">
                    {request.request_schedules?.sla_target_business_days
                      ? `${request.request_schedules.sla_target_business_days}bd`
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-ink/65">
                    {formatTime(startedAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-ink/65">
                    {formatTime(request.completed_at)}
                  </td>
                  <td className="px-3 py-4 text-ink/65">{window.label}</td>
                  <td className="px-3 py-4 text-right font-mono text-[11px] text-ink/65">
                    {window.hours}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-ink/65">
                    {fiscalPeriod(request.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-ink/65">
                    {fiscalPeriod(request.completed_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-ink/65">
                    {formatDateTime(request.updated_at ?? request.created_at)}
                  </td>
                  <td className="max-w-72 px-3 py-4 text-ink/65">
                    {comment ? (
                      <span title={comment.body}>
                        {comment.count} ·{" "}
                        {comment.body.length > 44 ? `${comment.body.slice(0, 44)}…` : comment.body}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  {renderActions ? (
                    <td className="px-3 py-4 pr-5 sm:pr-6">{renderActions(request)}</td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
