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
import { RequestsTable } from "@/features/dashboard/RequestsTable";
import { UploadDocumentForm } from "@/features/documents/UploadDocumentForm";

export function ClientDashboard({ data }: { data: ClientDashboardData }) {
  const { client, packages, requests, onboardings } = data;
  const activeRequests = requests.filter(
    (request) => request.status !== "completed" && request.status !== "cancelled",
  ).length;
  const outstandingDocuments = onboardings.reduce(
    (total, onboarding) =>
      total +
      onboarding.onboarding_documents.filter(
        (document) => document.status === "outstanding" || document.status === "rejected",
      ).length,
    0,
  );

  return (
    <div className="space-y-8">
      <WorkspaceHeader
        eyebrow="Client workspace"
        title={client?.business_name ?? "Your business"}
        description="Your active service arrangement, current requests, and compliance work in one accountable view."
        aside={client ? <Badge status={client.status} /> : null}
      />

      <section
        aria-label="Account overview"
        className="grid border-l border-t border-ink sm:grid-cols-3"
      >
        <Stat label="Service arrangements" value={packages.length} />
        <Stat label="Active requests" value={activeRequests} />
        <Stat
          label="Documents requiring attention"
          value={outstandingDocuments}
          tone={outstandingDocuments > 0 ? "amber" : undefined}
        />
      </section>

      <Section title="Service arrangements" subtitle="The packages currently held by your business">
        {packages.length === 0 ? (
          <Empty>No service arrangements yet.</Empty>
        ) : (
          <div className="grid border-l border-t border-ink lg:grid-cols-2">
            {packages.map((servicePackage) => (
              <article
                key={servicePackage.id}
                className="border-b border-r border-ink bg-paper p-5"
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

      <Section
        title="Service requests"
        subtitle="Work generated from your service arrangements or raised by your business"
      >
        <RequestsTable rows={requests} showProviderStatus />
      </Section>

      <Section
        title="Onboarding and compliance"
        subtitle="Requirements that keep your account ready for delivery"
      >
        {onboardings.length === 0 ? (
          <Empty>No onboarding record is attached to this account.</Empty>
        ) : (
          <div className="space-y-6">
            {onboardings.map((onboarding, index) => (
              <article key={onboarding.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink pb-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink/50">
                    Onboarding {String(index + 1).padStart(2, "0")}
                  </p>
                  <Badge status={onboarding.status} />
                </div>
                {onboarding.onboarding_documents.length === 0 ? (
                  <div className="pt-4">
                    <Empty>No compliance documents required.</Empty>
                  </div>
                ) : (
                  <ul>
                    {onboarding.onboarding_documents.map((document) => (
                      <li
                        key={document.id}
                        className="grid gap-3 border-b border-ink py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[13px] text-ink/70">
                            {document.compliance_document_types?.name ?? "Document"}
                          </span>
                          <Badge status={document.status} />
                        </div>
                        {document.status === "outstanding" || document.status === "rejected" ? (
                          <UploadDocumentForm
                            compact
                            onboardingDocumentId={document.id}
                            documentTypeId={document.document_type_id ?? undefined}
                            defaultTitle={document.compliance_document_types?.name}
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
