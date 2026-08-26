import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button, buttonStyles } from "@/components/ui/Button";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { Empty } from "@/features/dashboard/ui";
import { UploadDocumentForm } from "@/features/documents/UploadDocumentForm";
import {
  getComplianceChecklistForRequest,
  getThread,
  type ComplianceRequestChecklist,
} from "@/services/dashboard";
import { getCurrentProfile } from "@/services/profiles";
import { sendMessage } from "@/features/messages/actions";
import { messageTime, ROLE_LABEL } from "@/features/messages/ui";

export const metadata: Metadata = { title: "Conversation · BluBook" };
export const dynamic = "force-dynamic";

function ComplianceUploads({
  checklist,
  requestId,
  canUpload,
}: {
  checklist: ComplianceRequestChecklist;
  requestId: string;
  canUpload: boolean;
}) {
  return (
    <div className="mt-5 border-t border-ink pt-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cobalt">
        Required documents
      </p>
      <ul className="mt-3 divide-y divide-ink border-y border-ink">
        {checklist.onboarding_documents.map((item) => {
          const latestDocument = [...item.documents].sort((left, right) =>
            right.created_at.localeCompare(left.created_at),
          )[0];
          const acceptsUpload =
            canUpload && (item.status === "outstanding" || item.status === "rejected");

          return (
            <li key={item.id} className="space-y-3 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {item.compliance_document_types?.name ?? "Compliance document"}
                  </p>
                  {item.status === "received" ? (
                    <p className="mt-1 text-xs text-ink/55">Received — awaiting staff review</p>
                  ) : item.status === "rejected" ? (
                    <p className="mt-1 text-xs text-clay">A replacement document is required.</p>
                  ) : null}
                </div>
                <StatusLabel status={item.status} />
              </div>

              {latestDocument ? (
                <a
                  href={`/api/documents/${latestDocument.id}`}
                  className={buttonStyles({ variant: "secondary" })}
                >
                  View {latestDocument.title}
                </a>
              ) : null}

              {acceptsUpload ? (
                <UploadDocumentForm
                  compact
                  onboardingDocumentId={item.id}
                  requestId={requestId}
                  documentTypeId={item.document_type_id}
                  defaultTitle={item.compliance_document_types?.name ?? "Compliance document"}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
      {canUpload ? (
        <p className="mt-3 text-xs leading-5 text-ink/55">
          PDF, DOCX, XLSX, CSV, PNG and JPG files are accepted, up to 10 MB each.
        </p>
      ) : null}
    </div>
  );
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { requestId } = await params;
  const [thread, complianceChecklist] = await Promise.all([
    getThread(requestId),
    getComplianceChecklistForRequest(requestId),
  ]);
  // RLS returns nothing for a request the caller may not see.
  if (!thread) notFound();

  const messages = [...thread.request_messages].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const complianceMessageId = complianceChecklist ? messages[0]?.id : undefined;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/dashboard/messages"
        className="inline-block border-b border-ink text-[12px] font-medium text-ink hover:border-rust hover:text-rust"
      >
        ← All messages
      </Link>

      <header className="workspace-thread-header mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-rust">
            {thread.reference}
          </span>
          <StatusLabel status={thread.status} />
        </div>
        <h1 className="mt-3 text-[clamp(1.75rem,4vw,2.375rem)] font-semibold leading-none tracking-[-0.035em] text-ink">
          {thread.title}
        </h1>
      </header>

      <div className="mt-6 space-y-4">
        {messages.length === 0 ? (
          <Empty>No messages yet — start the conversation below.</Empty>
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === profile.id;
            return (
              <article
                key={message.id}
                className={`workspace-message ${message.id === complianceMessageId ? "max-w-full" : "max-w-[85%]"} ${
                  mine
                    ? "workspace-message--mine ml-auto"
                    : "workspace-message--theirs"
                }`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-rust">
                    {mine ? "You" : ROLE_LABEL[message.sender_role] ?? message.sender_role}
                  </span>
                  <span className="font-mono text-[10px] text-ink/45">
                    {messageTime(message.created_at)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap font-body text-sm leading-6 text-ink">
                  {message.body}
                </p>
                {complianceChecklist && message.id === complianceMessageId ? (
                  <ComplianceUploads
                    checklist={complianceChecklist}
                    requestId={thread.id}
                    canUpload={profile.user_type === "client"}
                  />
                ) : null}
              </article>
            );
          })
        )}
      </div>

      <form
        action={sendMessage}
        className="workspace-composer mt-6"
      >
        <input type="hidden" name="requestId" value={thread.id} />
        <label htmlFor="body" className="font-body text-xs font-semibold text-ink">
          Reply
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={3}
          placeholder="Write a message…"
          className="workspace-control mt-2 w-full resize-y rounded-md border border-ink/16 p-3 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-cobalt/60 focus:ring-[3px] focus:ring-cobalt/12"
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs leading-5 text-ink/55">
            Keep names and contact details out of messages.
          </p>
          <Button type="submit">
            Send <span aria-hidden="true">→</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
