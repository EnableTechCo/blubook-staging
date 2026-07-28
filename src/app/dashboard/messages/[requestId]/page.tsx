import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { Empty } from "@/features/dashboard/ui";
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
    <div className="mx-auto max-w-4xl">
      <Link
        href="/dashboard/messages"
        className="inline-block border-b border-ink text-[12px] font-medium text-ink hover:border-rust hover:text-rust"
      >
        ← All messages
      </Link>

      <header className="mt-6 border-b border-ink pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-rust">
            {thread.reference}
          </span>
          <StatusLabel status={thread.status} />
        </div>
        <h1 className="mt-3 font-heading text-[clamp(2.35rem,5vw,3.75rem)] font-normal leading-[0.95] tracking-[-0.04em] text-ink">
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
                className={`max-w-[85%] border p-4 ${
                  mine
                    ? "ml-auto border-rust/45 bg-cream"
                    : "border-ink bg-paper"
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
              </article>
            );
          })
        )}
      </div>

      <form
        action={sendMessage}
        className="mt-6 border-y border-ink bg-paper p-4 sm:p-5"
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
          className="mt-2 w-full border border-ink/35 bg-cream p-3 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-rust focus:ring-[3px] focus:ring-rust/15"
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
