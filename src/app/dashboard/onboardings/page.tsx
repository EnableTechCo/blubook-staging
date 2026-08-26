import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";
import { requireStaffRoute } from "@/services/staffRole";
import { getStaffOnboardings } from "@/services/dashboard";
import type { OnboardingQueueStage } from "@/services/onboardingFilters";
import { ComplianceReviewForm } from "@/features/onboarding/ComplianceReviewForm";
import { UploadDocumentForm } from "@/features/documents/UploadDocumentForm";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { Button, buttonStyles } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { SAST, SAST_LOCALE } from "@/lib/time";
import { WorkspaceHeader } from "@/features/dashboard/ui";

export const metadata: Metadata = { title: "Onboardings · BluBook" };
export const dynamic = "force-dynamic";

const date = (value: string) =>
  new Intl.DateTimeFormat(SAST_LOCALE, {
    timeZone: SAST,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const STAGES: { value: OnboardingQueueStage; label: string }[] = [
  { value: "all", label: "All" },
  { value: "awaiting_documents", label: "Awaiting documents" },
  { value: "awaiting_review", label: "Awaiting review" },
  { value: "rejected", label: "Rejected" },
  { value: "complete", label: "Complete" },
];

function onboardingHref(query: string, stage: OnboardingQueueStage): Route {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (stage !== "all") params.set("stage", stage);
  const suffix = params.toString();
  return (suffix ? `/dashboard/onboardings?${suffix}` : "/dashboard/onboardings") as Route;
}

export default async function OnboardingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (await requireStaffRoute("/dashboard/onboardings")) redirect("/dashboard");

  const { q: rawQuery, stage: rawStage } = await searchParams;
  const query = rawQuery?.trim().slice(0, 100) ?? "";
  const stage = STAGES.some((option) => option.value === rawStage)
    ? (rawStage as OnboardingQueueStage)
    : "all";
  const onboardings = await getStaffOnboardings(query, stage);
  const outstanding = onboardings.reduce(
    (count, onboarding) =>
      count +
      onboarding.onboarding_documents.filter((document) => document.status === "outstanding")
        .length,
    0,
  );
  const awaitingReview = onboardings.reduce(
    (count, onboarding) =>
      count +
      onboarding.onboarding_documents.filter((document) => document.status === "received").length,
    0,
  );

  return (
    <div className="mx-auto max-w-[92rem] space-y-7">
      <Link
        href="/dashboard"
        className="inline-flex min-h-10 items-center font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/55 hover:text-cobalt"
      >
        ← Back to control desk
      </Link>
      <WorkspaceHeader
        eyebrow="Operations / Compliance queue"
        title="Onboardings & compliance"
        description="Review client checklists, collect missing evidence and record the status of every compliance document."
        aside={<Link href="/dashboard/onboard" className={buttonStyles()}>Onboard a client</Link>}
      />

      <section className="workspace-panel workspace-search-panel" aria-label="Search onboardings">
        <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          {stage !== "all" ? <input type="hidden" name="stage" value={stage} /> : null}
          <div>
            <label htmlFor="onboarding-search" className={labelStyles}>
              Find a client
            </label>
            <input
              id="onboarding-search"
              name="q"
              type="search"
              defaultValue={query}
              maxLength={100}
              placeholder="Search by business name or Customer ID"
              className={fieldStyles}
            />
          </div>
          <Button type="submit">Search</Button>
          {query ? (
            <Link
              href={onboardingHref("", stage)}
              className={buttonStyles({ variant: "secondary" })}
            >
              Clear
            </Link>
          ) : null}
        </form>
        <p className="mt-3 text-xs text-ink/55" aria-live="polite">
          {query
            ? `${onboardings.length} client case${onboardings.length === 1 ? "" : "s"} found for “${query}”.`
            : "Search using the client’s registered business name or BluBook Customer ID."}
        </p>
        <div className="mt-4 border-t border-ink/8 pt-4">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/55">
            Filter by onboarding or checklist status
          </p>
          <div className="workspace-segments mt-3" aria-label="Onboarding or checklist status">
            {STAGES.map((option) => (
              <Link
                key={option.value}
                href={onboardingHref(query, option.value)}
                aria-current={stage === option.value ? "page" : undefined}
                className={`workspace-segment ${stage === option.value ? "is-active" : ""}`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="workspace-metric-band grid sm:grid-cols-2 xl:grid-cols-4" aria-label="Queue summary">
        <div className="workspace-metric-cell border-b border-r p-5">
          <strong className="workspace-metric-value" data-workspace-number>{onboardings.length}</strong>
          <p className="workspace-metric-label">
            Client cases
          </p>
        </div>
        <div className="workspace-metric-cell border-b border-r bg-cobalt-wash/55 p-5">
          <strong className="workspace-metric-value text-cobalt-deep" data-workspace-number>{awaitingReview}</strong>
          <p className="workspace-metric-label">
            Awaiting staff review
          </p>
        </div>
        <div className="workspace-metric-cell border-b border-r p-5">
          <strong className="workspace-metric-value" data-workspace-number>{outstanding}</strong>
          <p className="workspace-metric-label">
            Outstanding documents
          </p>
        </div>
        <div className="workspace-metric-cell border-b border-r p-5">
          <strong className="workspace-metric-value" data-workspace-number>
            {onboardings.reduce(
              (count, onboarding) => count + onboarding.onboarding_documents.length,
              0,
            )}
          </strong>
          <p className="workspace-metric-label">
            Total checklist items
          </p>
        </div>
      </section>

      {onboardings.length === 0 ? (
        <section className="workspace-empty px-5 py-16 text-center">
          <p className="text-xl font-semibold">
            {query || stage !== "all" ? "No matching client cases" : "No onboardings yet"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/55">
            {query || stage !== "all"
              ? "Adjust the business name, Customer ID or checklist stage and try again."
              : "New client cases will appear here with their generated compliance checklist."}
          </p>
          {query || stage !== "all" ? (
            <Link
              href="/dashboard/onboardings"
              className={`${buttonStyles({ variant: "secondary" })} mt-5`}
            >
              Clear search
            </Link>
          ) : null}
        </section>
      ) : (
        <div className="space-y-6">
          {onboardings.map((onboarding) => (
            <article key={onboarding.id} className="workspace-panel">
              <header className="workspace-panel-header">
                <div>
                  <h2 className="workspace-panel-title">
                    {onboarding.clients?.business_name ?? "Client"}
                  </h2>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.08em] text-ink/50">
                    {onboarding.clients?.external_reference ?? "Customer ID pending"} ·{" "}
                    Opened {date(onboarding.created_at)} ·{" "}
                    {onboarding.onboarding_documents.length} checklist items
                  </p>
                </div>
                <StatusLabel status={onboarding.status} />
              </header>

              {onboarding.onboarding_documents.length === 0 ? (
                <p className="m-5 rounded-xl border border-dashed border-ink/20 bg-cobalt-wash/30 px-4 py-8 text-center text-sm text-ink/55">
                  No compliance documents on this onboarding.
                </p>
              ) : (
                <ul className="divide-y divide-ink/8">
                  {onboarding.onboarding_documents.map((document, documentIndex) => {
                    const documents = [...document.documents].sort((left, right) =>
                      right.created_at.localeCompare(left.created_at),
                    );
                    const latestDocument = documents[0];
                    const documentName = document.compliance_document_types?.name ?? "Document";

                    return (
                      <li
                        key={document.id}
                        className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(16rem,1.6fr)] lg:items-start"
                      >
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink/45">
                            Document {String(documentIndex + 1).padStart(2, "0")}
                          </p>
                          <h3 className="mt-1 text-sm font-semibold">{documentName}</h3>
                          <div className="mt-2">
                            <StatusLabel status={document.status} />
                          </div>
                        </div>

                        <div>
                          {documents.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {documents.map((file) => (
                                  <a
                                    key={file.id}
                                    id={`document-${file.id}`}
                                    href={`/api/documents/${file.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${buttonStyles({ variant: "secondary" })} scroll-mt-24`}
                                  >
                                    View {file.title || "file"}
                                  </a>
                                ))}
                              </div>
                              {latestDocument ? (
                                <p className="text-xs leading-5 text-ink/55">
                                  {latestDocument.uploaded_by ===
                                  onboarding.clients?.primary_profile_id
                                    ? "Submitted by customer"
                                    : "Uploaded by staff"}{" "}
                                  on {date(latestDocument.created_at)}
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                          {onboarding.clients &&
                          (document.status === "outstanding" ||
                            document.status === "rejected") ? (
                            <div className={documents.length > 0 ? "mt-4" : ""}>
                              <p className="mb-2 text-xs text-ink/55">
                                Upload on the customer&apos;s behalf
                              </p>
                              <UploadDocumentForm
                                compact
                                clientId={onboarding.clients.id}
                                onboardingDocumentId={document.id}
                                documentTypeId={document.document_type_id ?? undefined}
                                defaultTitle={document.compliance_document_types?.name}
                              />
                            </div>
                          ) : !onboarding.clients ? (
                            <span className="text-xs text-ink/45">No client linked</span>
                          ) : null}
                        </div>

                        <div className="border-t border-ink/8 pt-4 lg:col-span-2">
                          {document.status === "received" && latestDocument ? (
                            <div>
                              {document.notes ? (
                                <p className="mb-3 rounded-r-lg border-l-[3px] border-cobalt/20 bg-cobalt-wash/25 px-3 py-2 text-xs leading-5 text-ink/55">
                                  Previous review message: {document.notes}
                                </p>
                              ) : null}
                              <ComplianceReviewForm
                                documentId={document.id}
                                documentName={documentName}
                                fileId={latestDocument.id}
                                fileTitle={latestDocument.title}
                              />
                            </div>
                          ) : (
                            <div className="rounded-xl border border-ink/8 bg-cobalt-wash/25 px-4 py-3 text-xs leading-5 text-ink/55">
                              {document.status === "verified"
                                ? "Accepted. The customer has been notified."
                                : document.status === "rejected"
                                  ? "Rejected. Waiting for the customer to upload a replacement."
                                  : "Waiting for the document to be submitted."}
                              {document.notes ? (
                                <span className="mt-2 block text-ink/70">
                                  Message: {document.notes}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
