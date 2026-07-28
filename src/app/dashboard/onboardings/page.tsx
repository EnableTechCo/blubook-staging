import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";
import { getStaffOnboardings } from "@/services/dashboard";
import { updateComplianceStatus } from "@/features/onboarding/actions";
import { UploadDocumentForm } from "@/features/documents/UploadDocumentForm";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { Button, buttonStyles } from "@/components/ui/Button";
import { fieldStyles } from "@/components/ui/formStyles";

export const metadata: Metadata = { title: "Onboardings · BluBook" };
export const dynamic = "force-dynamic";

const STATUSES = ["outstanding", "received", "verified", "rejected"] as const;

const titleCase = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());

const date = (value: string) =>
  new Intl.DateTimeFormat("en-ZA", {
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

      <section className="grid border-l border-t border-ink/35 sm:grid-cols-3" aria-label="Queue summary">
        <div className="border-b border-r border-ink/35 bg-paper-light p-5">
          <strong className="font-heading text-4xl font-normal">{onboardings.length}</strong>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.09em] text-ink/55">
            Client cases
          </p>
        </div>
        <div className="border-b border-r border-ink/35 bg-sun/25 p-5">
          <strong className="font-heading text-4xl font-normal">{outstanding}</strong>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.09em] text-ink/55">
            Outstanding documents
          </p>
        </div>
        <div className="border-b border-r border-ink/35 bg-cream/50 p-5">
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
            <article key={onboarding.id} className="border border-ink/35 bg-paper-light">
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
                <ul className="divide-y divide-ink/25">
                  {onboarding.onboarding_documents.map((document, documentIndex) => (
                    <li
                      key={document.id}
                      className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(12rem,1fr)_minmax(16rem,1.15fr)_auto] lg:items-center"
                    >
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink/45">
                          Document {String(documentIndex + 1).padStart(2, "0")}
                        </p>
                        <h3 className="mt-1 text-sm font-semibold">
                          {document.compliance_document_types?.name ?? "Document"}
                        </h3>
                        <div className="mt-2">
                          <StatusLabel status={document.status} />
                        </div>
                      </div>

                      <div>
                        {document.documents.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {document.documents.map((file) => (
                              <a
                                key={file.id}
                                href={`/api/documents/${file.id}`}
                                className={buttonStyles({ variant: "secondary" })}
                              >
                                View {file.title || "file"}
                              </a>
                            ))}
                          </div>
                        ) : onboarding.clients ? (
                          <UploadDocumentForm
                            compact
                            clientId={onboarding.clients.id}
                            onboardingDocumentId={document.id}
                            documentTypeId={document.document_type_id ?? undefined}
                            defaultTitle={document.compliance_document_types?.name}
                          />
                        ) : (
                          <span className="text-xs text-ink/45">No client linked</span>
                        )}
                      </div>

                      <form
                        action={updateComplianceStatus}
                        className="grid gap-2 sm:grid-cols-[minmax(10rem,1fr)_auto] lg:min-w-[18rem]"
                      >
                        <input type="hidden" name="documentId" value={document.id} />
                        <label htmlFor={`status-${document.id}`} className="sr-only">
                          Status for {document.compliance_document_types?.name ?? "document"}
                        </label>
                        <select
                          id={`status-${document.id}`}
                          key={document.status}
                          name="status"
                          defaultValue={document.status}
                          className={`${fieldStyles} mt-0 min-h-11`}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {titleCase(status)}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" variant="secondary" className="px-4">
                          Update
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
