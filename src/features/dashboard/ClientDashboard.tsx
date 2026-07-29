import type { ClientDashboardData } from "@/services/dashboard";
import {
  Badge,
  Empty,
  money,
  Section,
  Stat,
  titleCase,
  WorkspaceHeader,
} from "@/features/dashboard/ui";

export function ClientDashboard({ data }: { data: ClientDashboardData }) {
  const { client, packages, requests } = data;
  const activeRequests = requests.filter(
    (request) => request.status !== "completed" && request.status !== "cancelled",
  ).length;

  return (
    <div className="space-y-8">
      <WorkspaceHeader
        eyebrow="Client workspace"
        title={client?.business_name ?? "Your business"}
        description="Your active service package and current requests in one accountable view."
        aside={client ? <Badge status={client.status} /> : null}
      />

      <section
        aria-label="Account overview"
        className="grid border-l border-t border-ink sm:grid-cols-2"
      >
        <Stat label="Service packages" value={packages.length} />
        <Stat label="Active requests" value={activeRequests} />
      </section>

      <Section title="Service packages" subtitle="The packages currently held by your business">
        {packages.length === 0 ? (
          <Empty>No service packages yet.</Empty>
        ) : (
          <div className={`grid gap-4 ${packages.length > 1 ? "lg:grid-cols-2" : ""}`}>
            {packages.map((servicePackage) => (
              <article
                key={servicePackage.id}
                className="border border-ink bg-paper p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-rust">
                      {titleCase(servicePackage.type)}
                      {servicePackage.tier ? ` · ${titleCase(servicePackage.tier)}` : ""}
                    </p>
                    <h3 className="mt-2 font-heading text-[1.55rem] font-normal leading-tight text-ink">
                      {servicePackage.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <Badge status={servicePackage.status} />
                    <p className="mt-3 text-sm font-semibold text-ink">
                      {money(servicePackage.total_price)}
                    </p>
                  </div>
                </div>
                <ul className="mt-6 border-t border-ink">
                  {servicePackage.client_package_line_items.map((lineItem, index) => (
                    <li
                      key={`${lineItem.name}-${index}`}
                      className="flex items-start justify-between gap-6 border-b border-ink py-3 text-[13px]"
                    >
                      <span className="text-ink/65">
                        {lineItem.name}
                        <span className="ml-2 text-[10px] uppercase tracking-[0.1em] text-ink/40">
                          {titleCase(lineItem.tier)}
                          {lineItem.quantity > 1 ? ` ×${lineItem.quantity}` : ""}
                        </span>
                      </span>
                      <span className="whitespace-nowrap font-medium text-ink">
                        {money(lineItem.unit_price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
