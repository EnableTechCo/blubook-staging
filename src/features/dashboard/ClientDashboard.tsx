import type { ClientDashboardData } from "@/services/dashboard";
import { Badge, Empty, money, Section, titleCase } from "@/features/dashboard/ui";
import { RequestsTable } from "@/features/dashboard/RequestsTable";

export function ClientDashboard({ data }: { data: ClientDashboardData }) {
  const { client, packages, requests, onboardings } = data;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-700">Client workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{client?.business_name ?? "Your business"}</h1>
        </div>
        {client ? <Badge status={client.status} /> : null}
      </header>

      <Section title="Packages" subtitle="Your purchased packages and their line items">
        {packages.length === 0 ? (
          <Empty>No packages yet.</Empty>
        ) : (
          <div className="space-y-4">
            {packages.map((p) => (
              <div key={p.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {p.name}{" "}
                    <span className="text-xs text-slate-500">
                      ({titleCase(p.type)}
                      {p.tier ? ` · ${titleCase(p.tier)}` : ""})
                    </span>
                  </div>
                  <div className="text-sm font-semibold">{money(p.total_price)}</div>
                </div>
                <ul className="mt-2 space-y-1">
                  {p.client_package_line_items.map((li, i) => (
                    <li key={i} className="flex justify-between text-sm text-slate-600">
                      <span>
                        {li.name} <span className="text-xs text-slate-400">· {titleCase(li.tier)}</span>
                        {li.quantity > 1 ? <span className="text-xs text-slate-400"> ×{li.quantity}</span> : null}
                      </span>
                      <span>{money(li.unit_price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Service requests" subtitle="Work items generated from your packages or raised by you">
        <RequestsTable rows={requests} showProvider />
      </Section>

      <Section title="Onboarding & compliance" subtitle="Your onboarding status and document checklist">
        {onboardings.length === 0 ? (
          <Empty>No onboarding on record.</Empty>
        ) : (
          <div className="space-y-3">
            {onboardings.map((o) => (
              <div key={o.id}>
                <div className="mb-2 flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Status:</span>
                  <Badge status={o.status} />
                </div>
                {o.onboarding_documents.length === 0 ? (
                  <Empty>No compliance documents required.</Empty>
                ) : (
                  <ul className="space-y-1">
                    {o.onboarding_documents.map((d, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{d.compliance_document_types?.name ?? "Document"}</span>
                        <Badge status={d.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
