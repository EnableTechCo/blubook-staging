import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import type { RequestRow } from "@/services/dashboard";
import { Empty, formatDate } from "@/features/dashboard/ui";
import { isSameSastDay, SAST, SAST_LOCALE, sastFiscalPeriod } from "@/lib/time";
import { NavigableRequestRow } from "@/features/dashboard/NavigableRequestRow";
import {
  clientIdentity,
  clientLabel,
  requestKindLabel,
  requestStatusLabel,
  resolverLabel,
} from "@/features/requests/presentation";
import { StatusLabel } from "@/components/ui/StatusLabel";

type RequestTableView = "client" | "provider" | "staff";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(SAST_LOCALE, {
    timeZone: SAST,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString(SAST_LOCALE, {
    timeZone: SAST,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// This column used to compute its own period: ISO weeks and calendar quarters,
// labelled FY. BluBook's fiscal year opens on 1 March, so the same request read
// Q3 here and Q2 on any view built from the fiscal calendar. It now uses the
// one definition in src/lib/time.ts, so the tracker and the dashboards agree.
function fiscalPeriod(value: string | null | undefined): string {
  if (!value) return "—";
  const source = new Date(value);
  if (Number.isNaN(source.getTime())) return "—";

  const period = sastFiscalPeriod(source);
  return `${period.year}-W${String(period.week).padStart(2, "0")} · Q${period.quarter} · FY${period.year}`;
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

  const sameDay = isSameSastDay(due, completed);
  const size = Math.abs(variance) >= 4 ? "4+ hrs" : "Under 4 hrs";
  const direction = variance > 0 ? "late" : "early";
  return {
    label: `${sameDay ? "Same day" : "Different day"} · ${size} ${direction}`,
    hours: variance.toFixed(1),
  };
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
    <div className="workspace-operations-table -mx-5 sm:-mx-6">
      <div className="workspace-table-toolbar">
        <span className="font-semibold text-ink">{rows.length} service request{rows.length === 1 ? "" : "s"}</span>
        <span>Scroll for all fields · references and headings stay pinned</span>
      </div>
      <div
        aria-label="Service request operations table"
        className="workspace-table-scroll relative isolate z-0 max-h-[70vh] max-w-full overflow-auto overscroll-contain [scrollbar-gutter:stable]"
        role="region"
        tabIndex={0}
      >
        <table className="workspace-data-table w-max min-w-[2260px] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-y border-ink/8 bg-cream/80 text-[9px] uppercase tracking-[0.1em] text-ink/65">
              <th className="sticky left-0 top-0 z-30 min-w-36 bg-cream px-5 py-3 font-medium sm:pl-6">
                SR number
              </th>
              <th className="sticky top-0 z-20 bg-cream min-w-32 px-3 py-3 font-medium">Status</th>
              {showClient ? <th className="sticky top-0 z-20 bg-cream min-w-40 px-3 py-3 font-medium">Cust number</th> : null}
              <th className="sticky top-0 z-20 bg-cream min-w-36 px-3 py-3 font-medium">Request type</th>
              <th className="sticky top-0 z-20 bg-cream min-w-56 px-3 py-3 font-medium">Title</th>
              <th className="sticky top-0 z-20 bg-cream min-w-40 px-3 py-3 font-medium">Service</th>
              <th className="sticky top-0 z-20 bg-cream min-w-36 px-3 py-3 font-medium">Work group</th>
              <th className="sticky top-0 z-20 bg-cream min-w-40 px-3 py-3 font-medium">Resolver</th>
              <th className="sticky top-0 z-20 bg-cream min-w-36 px-3 py-3 font-medium">Partner WO</th>
              <th className="sticky top-0 z-20 bg-cream min-w-36 px-3 py-3 font-medium">SLA start</th>
              <th className="sticky top-0 z-20 bg-cream min-w-28 px-3 py-3 font-medium">SLA end</th>
              <th className="sticky top-0 z-20 bg-cream min-w-20 px-3 py-3 font-medium">SLA</th>
              <th className="sticky top-0 z-20 bg-cream min-w-28 px-3 py-3 font-medium">Service start</th>
              <th className="sticky top-0 z-20 bg-cream min-w-28 px-3 py-3 font-medium">Service end</th>
              <th className="sticky top-0 z-20 bg-cream min-w-52 px-3 py-3 font-medium">Window result</th>
              <th className="sticky top-0 z-20 bg-cream min-w-28 px-3 py-3 font-medium">Variance hrs</th>
              <th className="sticky top-0 z-20 bg-cream min-w-52 px-3 py-3 font-medium">Created fiscal</th>
              <th className="sticky top-0 z-20 bg-cream min-w-52 px-3 py-3 font-medium">Closed fiscal</th>
              <th className="sticky top-0 z-20 bg-cream min-w-40 px-3 py-3 font-medium">Last updated</th>
              <th className="sticky top-0 z-20 bg-cream min-w-64 px-3 py-3 font-medium">Comments</th>
              {renderActions ? <th className="sticky top-0 z-20 bg-cream min-w-48 px-3 py-3 pr-5 font-medium sm:pr-6">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((request) => {
              const startedAt = serviceStartedAt(request);
              const window = windowResult(request);
              const comment = latestComment(request);

              return (
                <NavigableRequestRow
                  key={request.id}
                  href={`/dashboard/reports/requests/${request.id}` as Route}
                  label={`Open service request ${request.reference}: ${request.title}`}
                >
                  <td className="sticky left-0 z-[1] bg-paper px-5 py-3 font-mono text-[11px] text-cobalt-deep transition-colors group-hover:bg-cobalt-wash group-focus-visible:bg-cobalt-wash sm:pl-6">
                    <Link
                      href={`/dashboard/reports/requests/${request.id}`}
                      className="border-b border-transparent hover:border-cobalt hover:text-cobalt focus-visible:border-cobalt focus-visible:text-cobalt"
                    >
                      {request.reference}
                    </Link>
                  </td>
                  <td className="px-3 py-4">
                    <StatusLabel
                      status={request.status}
                      label={requestStatusLabel(request, view)}
                    />
                  </td>
                  {showClient ? (
                    <td className="px-3 py-4 text-ink/65">
                      {clientLabel(request)}
                      {/* Present only for a premium partner, and for staff and
                          the client themselves. Null for everyone else, so the
                          cell reads exactly as it did before. */}
                      {clientIdentity(request) ? (
                        <span className="mt-0.5 block text-[11px] text-ink/45">
                          {clientIdentity(request)}
                        </span>
                      ) : null}
                    </td>
                  ) : null}
                  <td className="px-3 py-4 text-ink/65">{requestKindLabel(request)}</td>
                  <td className="max-w-64 px-3 py-4 font-medium text-ink">
                    <Link
                      href={`/dashboard/reports/requests/${request.id}`}
                      className="hover:text-cobalt"
                    >
                      {request.title}
                    </Link>
                  </td>
                  <td className="px-3 py-4 text-ink/65">{request.services?.name ?? "—"}</td>
                  <td className="px-3 py-4 text-ink/65">
                    {request.services?.service_groups?.name ?? request.services?.name ?? "—"}
                  </td>
                  <td className="px-3 py-4 text-ink/65">{resolverLabel(request)}</td>
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
                </NavigableRequestRow>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
