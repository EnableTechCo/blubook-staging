import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";
import { getStaffOnboardings } from "@/services/dashboard";
import { ComplianceReviewForm } from "@/features/onboarding/ComplianceReviewForm";
import { UploadDocumentForm } from "@/features/documents/UploadDocumentForm";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { buttonStyles } from "@/components/ui/Button";
import { SAST, SAST_LOCALE } from "@/lib/time";

export const metadata: Metadata = { title: "Onboardings · BluBook" };
export const dynamic = "force-dynamic";

const date = (value: string) =>
  new Intl.DateTimeFormat(SAST_LOCALE, {
    timeZone: SAST,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default async function OnboardingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "staff") redirect("/dashboard");

  const onboardings = await getStaffOnboardings();
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
      <header className="border-b border-ink pb-7 lg:flex lg:items-end lg:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex min-h-10 items-center font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/60 hover:text-cobalt"
          >
            ← Back to control desk
          </Link>
          <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cobalt">
            Operations / Compliance queue
          </p>
          <h1 className="mt-3 font-heading text-4xl leading-none sm:text-5xl">
            Onboardings & compliance
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/65">
            Review client checklists, collect missing evidence and record the status of every
            compliance document.
          </p>
        </div>
        <Link
          href="/dashboard/onboard"
          className={`${buttonStyles()} mt-6 lg:mt-0`}
        >
          Onboard a client
        </Link>
      </header>

      <section className="grid border-l border-t border-ink sm:grid-cols-2 xl:grid-cols-4" aria-label="Queue summary">
        <div className="border-b border-r border-ink bg-paper-light p-5">
          <strong className="font-heading text-4xl font-normal">{onboardings.length}</strong>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.09em] text-ink/55">
            Client cases
          </p>
        </div>
        <div className="border-b border-r border-ink bg-sun/25 p-5">
          <strong className="font-heading text-4xl font-normal">{awaitingReview}</strong>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.09em] text-ink/55">
            Awaiting staff review
          </p>
        </div>
        <div className="border-b border-r border-ink bg-cream/50 p-5">
          <strong className="font-heading text-4xl font-normal">{outstanding}</strong>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.09em] text-ink/55">
            Outstanding documents
          </p>
        </div>
        <div className="border-b border-r border-ink bg-paper-light p-5">
          <strong className="font-heading text-4xl font-normal">
            {onboardings.reduce(
              (count, onboarding) => count + onboarding.onboarding_documents.length,
              0,
            )}
          </strong>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.09em] text-ink/55">
            Total checklist items
          </p>
        </div>
      </section>

      {onboardings.length === 0 ? (
        <section className="border border-dashed border-ink/35 bg-cream/35 px-5 py-16 text-center">
          <p className="font-heading text-2xl">No onboardings yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/55">
            New client cases will appear here with their generated compliance checklist.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {onboardings.map((onboarding, index) => (
            <article key={onboarding.id} className="border border-ink bg-paper-light">
              <header className="grid gap-4 border-b border-ink px-5 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                <span className="font-heading text-3xl text-cobalt" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="font-heading text-2xl leading-none">
                    {onboarding.clients?.business_name ?? "Client"}
                  </h2>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.08em] text-ink/50">
                    Opened {date(onboarding.created_at)} ·{" "}
                    {onboarding.onboarding_documents.length} checklist items
                  </p>
                </div>
                <StatusLabel status={onboarding.status} />
              </header>

              {onboarding.onboarding_documents.length === 0 ? (
                <p className="m-5 border border-dashed border-ink/30 bg-cream/35 px-4 py-8 text-center text-sm text-ink/55">
                  No compliance documents on this onboarding.
                </p>
              ) : (
                <ul className="divide-y divide-ink">
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

                        <div className="border-t border-ink/25 pt-4 lg:col-span-2">
                          {document.status === "received" && latestDocument ? (
                            <div>
                              {document.notes ? (
                                <p className="mb-3 border-l-[3px] border-ink/25 px-3 text-xs leading-5 text-ink/55">
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
                            <div className="border-l-[3px] border-ink/25 px-4 py-3 text-xs leading-5 text-ink/55">
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
