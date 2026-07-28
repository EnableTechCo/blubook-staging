import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { getThread } from "@/services/dashboard";
import { getCurrentProfile } from "@/services/profiles";
import { sendMessage } from "@/features/messages/actions";
import { messageTime, ROLE_LABEL } from "@/features/messages/ui";

export const metadata: Metadata = { title: "Conversation · BluBook" };
export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { requestId } = await params;
  const thread = await getThread(requestId);
  // RLS returns nothing for a request the caller may not see.
  if (!thread) notFound();

  const messages = [...thread.request_messages].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/messages"
        className="font-body text-sm text-slate-600 hover:text-cobalt"
      >
        ← All messages
      </Link>

      <header className="mt-4 border-b border-ink/20 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-cobalt">
            {thread.reference}
          </span>
          <StatusLabel status={thread.status} />
        </div>
        <h1 className="mt-2 font-heading text-3xl font-medium tracking-[-0.03em] text-ink">
          {thread.title}
        </h1>
      </header>

      <div className="mt-6 space-y-4">
        {messages.length === 0 ? (
          <p className="border-l-[3px] border-sun bg-paper px-4 py-3 font-body text-sm text-slate-600">
            No messages yet — start the conversation below.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === profile.id;
            return (
              <article
                key={message.id}
                className={`max-w-[85%] border p-4 ${
                  mine
                    ? "ml-auto border-cobalt bg-cobalt-wash"
                    : "border-ink/25 bg-paper-light"
                }`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-cobalt">
                    {mine ? "You" : ROLE_LABEL[message.sender_role] ?? message.sender_role}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {messageTime(message.created_at)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap font-body text-sm leading-6 text-ink">
                  {message.body}
                </p>
              </article>
            );
          })
        )}
      </div>

      <form
        action={sendMessage}
        className="mt-6 border border-ink/30 bg-paper-light/95 p-4"
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
          className="mt-2 w-full border border-ink/35 bg-paper-light p-3 font-body text-sm text-ink outline-none placeholder:text-slate-400 focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="font-body text-xs leading-5 text-slate-600">
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
