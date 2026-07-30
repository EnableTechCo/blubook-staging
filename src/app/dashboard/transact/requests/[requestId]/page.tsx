import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonStyles } from "@/components/ui/Button";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { RequestAttachmentUploader } from "@/features/documents/RequestAttachmentUploader";
import { Section, WorkspaceHeader, formatDate, titleCase } from "@/features/dashboard/ui";
import { ProviderRequestActions } from "@/features/requests/ProviderRequestActions";
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
  const acceptsFiles =
    profile.user_type !== "staff" &&
    request.status !== "completed" &&
    request.status !== "cancelled";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        href={profile.user_type === "staff" ? "/dashboard" : "/dashboard/transact/requests"}
        className="inline-block border-b border-ink text-xs font-medium text-ink hover:border-cobalt hover:text-cobalt"
      >
        ← {profile.user_type === "staff" ? "Dashboard" : "Service Request Tracker"}
      </Link>

      <WorkspaceHeader
        eyebrow={request.reference}
        title={request.title}
        description={`${titleCase(request.request_type ?? "general")} · ${request.services?.name ?? "Service"}`}
        aside={<StatusLabel status={request.status} />}
      />

      <Section
        title="Request details"
        subtitle={`Submitted ${formatDate(request.created_at)}`}
        action={
          isProvider ? (
            <ProviderRequestActions request={request} />
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
        <dl className="grid gap-px border border-ink bg-ink sm:grid-cols-3">
          <Detail label="Status" value={titleCase(request.status)} />
          <Detail label="Service" value={request.services?.name ?? "—"} />
          <Detail
            label="Partner"
            value={request.provider_id ? (isProvider ? "Your team" : "Assigned") : "Routing queue"}
          />
        </dl>
        <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-ink">
          {request.description || "No additional description supplied."}
        </div>
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
                  <span className="text-sm font-semibold text-ink">{titleCase(event.to_status)}</span>
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
