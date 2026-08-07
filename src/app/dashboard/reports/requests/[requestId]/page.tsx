import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button, buttonStyles } from "@/components/ui/Button";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { RequestAttachmentUploader } from "@/features/documents/RequestAttachmentUploader";
import { Section, WorkspaceHeader, formatDate, titleCase } from "@/features/dashboard/ui";
import { ProviderRequestActions } from "@/features/requests/ProviderRequestActions";
import { ProviderInvoiceCompletion } from "@/features/requests/ProviderInvoiceCompletion";
import { acknowledgeDocument } from "@/features/requests/actions";
import {
  clientLabel,
  isDocumentDelivery,
  requestKindLabel,
  requestStatusLabel,
  resolverLabel,
} from "@/features/requests/presentation";
import { getRequestDetail } from "@/services/dashboard";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Service Request · BluBook" };
export const dynamic = "force-dynamic";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "Size unavailable";
  const units = ["B", "KB", "MB", "GB"];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { requestId } = await params;
  const request = await getRequestDetail(requestId);
  if (!request) notFound();

  const documents = request.request_documents
    .map((link) => link.documents)
    .filter((document) => document !== null)
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
  const isProvider = profile.user_type === "service_provider";
  const viewer =
    profile.user_type === "service_provider"
      ? "provider"
      : profile.user_type === "staff"
        ? "staff"
        : "client";
  const acceptsFiles =
    profile.user_type !== "staff" &&
    request.status !== "completed" &&
    request.status !== "cancelled";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        href={profile.user_type === "staff" ? "/dashboard" : "/dashboard/reports/requests"}
        className="inline-block border-b border-ink text-xs font-medium text-ink hover:border-cobalt hover:text-cobalt"
      >
        ← {profile.user_type === "staff" ? "Dashboard" : "Service Request Tracker"}
      </Link>

      <WorkspaceHeader
        eyebrow={request.reference}
        title={request.title}
        description={`${requestKindLabel(request)} · ${request.services?.name ?? "Service"}`}
        aside={
          <StatusLabel
            status={request.status}
            label={requestStatusLabel(request, viewer)}
          />
        }
      />

      <Section
        title="Request details"
        subtitle={`Submitted ${formatDate(request.created_at)}`}
        action={
          isProvider ? (
            <ProviderRequestActions request={request} />
          ) : isDocumentDelivery(request) && request.status === "new" && !isProvider ? (
            // The client closes a delivery themselves by acknowledging it.
            <form action={acknowledgeDocument}>
              <input type="hidden" name="requestId" value={request.id} />
              <Button type="submit">
                Acknowledge receipt <span aria-hidden="true">→</span>
              </Button>
            </form>
          ) : request.provider_id ? (
            <Link
              href={`/dashboard/messages/${request.id}`}
              className={buttonStyles({ variant: "secondary" })}
            >
              Open conversation
            </Link>
          ) : null
        }
      >
        <dl className="grid gap-px border border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
          {/* Staff see the real customer number; the two parties see a
              pseudonym, so neither learns who the other is. */}
          <Detail label="Client ID" value={clientLabel(request)} />
          <Detail label="Service" value={request.services?.name ?? "—"} />
          <Detail
            label="Work group"
            value={request.services?.service_groups?.name ?? request.services?.name ?? "—"}
          />
          {/* A category, not a name — the same value every viewer sees. */}
          <Detail label="Resolver" value={resolverLabel(request)} />
          {/* One SR Type, merging how it was raised with what kind of request it is. */}
          <Detail label="Request type" value={requestKindLabel(request)} />
          <Detail label="Partner WO" value={request.partner_work_order_reference ?? "—"} />
          <Detail
            label="Last updated"
            value={formatDate(request.updated_at ?? request.created_at)}
          />
          <Detail label="SLA due" value={formatDate(request.request_schedules?.due_at)} />
        </dl>
        <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-ink">
          {request.description || "No additional description supplied."}
        </div>
        {request.sales_opportunities ? (
          <div className="mt-6 border border-ink bg-paper-light p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cobalt">Linked opportunity</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Deal ID" value={request.sales_opportunities.deal_reference} />
              <Detail label="Opportunity" value={request.sales_opportunities.opportunity_name} />
              <Detail label="Revenue" value={`${request.sales_opportunities.currency} ${request.sales_opportunities.revenue.toLocaleString("en-ZA")}`} />
              <Detail
                label="Expected period"
                value={request.sales_opportunities.fiscal_year
                  ? `FY${request.sales_opportunities.fiscal_year}${request.sales_opportunities.fiscal_quarter ? ` · Q${request.sales_opportunities.fiscal_quarter}` : ""}${request.sales_opportunities.fiscal_week ? ` · W${request.sales_opportunities.fiscal_week}` : ""}`
                  : "—"}
              />
              <Detail label="Invoice" value={request.sales_opportunities.invoice_number ?? "—"} />
            </div>
          </div>
        ) : null}
        {isProvider && request.request_type === "purchase_order" && request.sales_opportunity_id && request.status === "in_progress" ? (
          <ProviderInvoiceCompletion requestId={request.id} />
        ) : null}
        {isProvider && request.provider_id ? (
          <Link
            href={`/dashboard/messages/${request.id}`}
            className="mt-5 inline-block border-b border-ink text-xs font-semibold text-ink hover:border-cobalt hover:text-cobalt"
          >
            Open conversation →
          </Link>
        ) : null}
      </Section>

      <Section
        title="Shared files"
        subtitle={`${documents.length} file${documents.length === 1 ? "" : "s"} attached to this request`}
      >
        {documents.length > 0 ? (
          <ul className="divide-y divide-ink border-y border-ink">
            {documents.map((document) => (
              <li
                key={document.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{document.title}</p>
                  <p className="mt-1 text-xs text-ink/55">
                    {formatBytes(document.size_bytes)} · {formatDate(document.created_at)} ·{" "}
                    {document.uploaded_by === profile.id
                      ? "Uploaded by you"
                      : profile.user_type === "client"
                        ? "Shared by your partner or BluBook"
                        : profile.user_type === "service_provider"
                          ? "Shared by the client or BluBook"
                          : "Shared by a request participant"}
                  </p>
                </div>
                <a
                  href={`/api/documents/${document.id}`}
                  className={buttonStyles({ variant: "secondary" })}
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-l-[3px] border-sun bg-cream/45 px-4 py-3 text-sm text-ink/60">
            No files have been shared yet.
          </p>
        )}

        {acceptsFiles ? (
          <div className="mt-6 border-t border-ink pt-6">
            <RequestAttachmentUploader requestId={request.id} />
          </div>
        ) : null}
      </Section>

      <Section title="Status history" subtitle="Recorded service-request milestones">
        {request.request_events && request.request_events.length > 0 ? (
          <ol className="divide-y divide-ink border-y border-ink">
            {[...request.request_events]
              .sort((left, right) => right.created_at.localeCompare(left.created_at))
              .map((event) => (
                <li key={`${event.to_status}-${event.created_at}`} className="flex justify-between gap-4 py-3">
                  <span className="text-sm font-semibold text-ink">
                    {requestStatusLabel(
                      { request_type: request.request_type, status: event.to_status },
                      viewer,
                    ) ?? titleCase(event.to_status)}
                  </span>
                  <span className="text-xs text-ink/55">{formatDate(event.created_at)}</span>
                </li>
              ))}
          </ol>
        ) : (
          <p className="text-sm text-ink/55">No status milestones have been recorded yet.</p>
        )}
      </Section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-cream p-4">
      <dt className="text-[9px] font-medium uppercase tracking-[0.15em] text-ink/50">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
