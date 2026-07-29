import type { RequestRow } from "@/services/dashboard";
import { Empty, titleCase } from "@/features/dashboard/ui";

const STATUSES = [
  "new",
  "awaiting_assignment",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
] as const;

function percentage(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function completedOnTime(request: RequestRow): boolean | null {
  const dueAt = request.request_schedules?.due_at;
  if (!dueAt || !request.completed_at) return null;
  return new Date(request.completed_at).getTime() <= new Date(dueAt).getTime();
}

function averageTurnaroundDays(requests: RequestRow[]): string {
  const durations = requests
    .filter((request) => request.completed_at)
    .map(
      (request) =>
        (new Date(request.completed_at!).getTime() - new Date(request.created_at).getTime()) /
        86_400_000,
    )
    .filter(Number.isFinite);

  if (durations.length === 0) return "—";
  return `${(durations.reduce((sum, duration) => sum + duration, 0) / durations.length).toFixed(1)}d`;
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <article className="border-b border-r border-ink bg-paper-light/70 p-5">
      <p className="font-heading text-4xl leading-none text-ink">{value}</p>
      <p className="mt-4 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
        {label}
      </p>
      <p className="mt-2 text-xs leading-5 text-ink/55">{note}</p>
    </article>
  );
}

export function RequestPerformanceDashboard({
  requests,
  audience,
}: {
  requests: RequestRow[];
  audience: "client" | "provider";
}) {
  if (requests.length === 0) {
    return <Empty>Performance data will appear when service requests are available.</Empty>;
  }

  const completed = requests.filter((request) => request.status === "completed");
  const active = requests.filter(
    (request) => request.status !== "completed" && request.status !== "cancelled",
  );
  const measurable = completed
    .map(completedOnTime)
    .filter((result): result is boolean => result !== null);
  const onTime = measurable.filter(Boolean).length;

  const serviceCounts = new Map<string, number>();
  for (const request of requests) {
    const service = request.services?.name ?? "Unclassified";
    serviceCounts.set(service, (serviceCounts.get(service) ?? 0) + 1);
  }
  const services = [...serviceCounts.entries()].sort((left, right) => right[1] - left[1]);
  const largestServiceCount = services[0]?.[1] ?? 1;

  return (
    <div className="space-y-8">
      <section
        aria-label="Request performance summary"
        className="grid border-l border-t border-ink sm:grid-cols-2 xl:grid-cols-4"
      >
        <Metric label="Total requests" value={requests.length} note="All visible service requests" />
        <Metric label="Active workload" value={active.length} note="Open or being delivered" />
        <Metric
          label="On-time completion"
          value={measurable.length > 0 ? `${percentage(onTime, measurable.length)}%` : "—"}
          note={`${measurable.length} completed request${measurable.length === 1 ? "" : "s"} with SLA dates`}
        />
        <Metric
          label="Average turnaround"
          value={averageTurnaroundDays(completed)}
          note="Created to completed"
        />
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="border-y border-ink bg-paper-light/45 p-5 sm:p-7">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-rust">
            Request status
          </p>
          <h2 className="mt-3 font-heading text-3xl font-normal text-ink">Current pipeline</h2>
          <div className="mt-7 space-y-5">
            {STATUSES.map((status) => {
              const count = requests.filter((request) => request.status === status).length;
              return (
                <div key={status}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-xs">
                    <span className="font-medium text-ink">{titleCase(status)}</span>
                    <span className="font-mono text-[10px] text-ink/55">
                      {count} · {percentage(count, requests.length)}%
                    </span>
                  </div>
                  <div className="h-2 border border-ink bg-paper">
                    <div
                      className="h-full bg-clay"
                      style={{ width: `${percentage(count, requests.length)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-y border-ink bg-paper-light/45 p-5 sm:p-7">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-rust">
            Service demand
          </p>
          <h2 className="mt-3 font-heading text-3xl font-normal text-ink">
            {audience === "provider" ? "Delivered services" : "Requests by service"}
          </h2>
          <div className="mt-7 space-y-5">
            {services.map(([service, count]) => (
              <div key={service}>
                <div className="mb-2 flex items-center justify-between gap-4 text-xs">
                  <span className="font-medium text-ink">{service}</span>
                  <span className="font-mono text-[10px] text-ink/55">{count}</span>
                </div>
                <div className="h-2 border border-ink bg-paper">
                  <div
                    className="h-full bg-cobalt"
                    style={{ width: `${percentage(count, largestServiceCount)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
