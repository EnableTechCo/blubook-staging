import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/features/dashboard/ui";
import { getWorkGroupConversation } from "@/services/dashboard";
import { getCurrentProfile } from "@/services/profiles";
import { sendWorkGroupMessage } from "@/features/messages/groupActions";
import { messageTime, ROLE_LABEL } from "@/features/messages/ui";

export const metadata: Metadata = { title: "Work group conversation · BluBook" };
export const dynamic = "force-dynamic";

export default async function WorkGroupThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { conversationId } = await params;
  const conversation = await getWorkGroupConversation(conversationId);
  // RLS returns nothing for a conversation the caller may not see.
  if (!conversation) notFound();

  const messages = [...conversation.work_group_messages].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const isClient = profile.user_type === "client";

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/dashboard/messages"
        className="inline-block border-b border-ink text-[12px] font-medium text-ink hover:border-rust hover:text-rust"
      >
        ← All messages
      </Link>

      <header className="mt-6 border-b border-ink/20 pb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-rust">
          {conversation.service_groups?.name ?? "Work group"}
        </p>
        <h1 className="mt-3 font-heading text-[clamp(2.35rem,5vw,3.75rem)] font-normal leading-[0.95] tracking-[-0.04em] text-ink">
          {conversation.subject}
        </h1>
        <p className="mt-3 text-[13px] leading-6 text-ink/60">
          {conversation.assigned_provider_id
            ? isClient
              ? "A partner in this work group has picked this up. Their identity is not shown."
              : "This conversation was assigned to you from the work group."
            : "Waiting for a partner in this work group to pick this up."}
        </p>
      </header>

      <div className="mt-6 space-y-4">
        {messages.length === 0 ? (
          <Empty>No messages yet.</Empty>
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === profile.id;
            return (
              <article
                key={message.id}
                className={`max-w-[85%] border p-4 ${
                  mine ? "ml-auto border-rust/45 bg-cream" : "border-ink/20 bg-paper"
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

      <form action={sendWorkGroupMessage} className="mt-6 border-y border-ink/20 bg-paper p-4 sm:p-5">
        <input type="hidden" name="conversationId" value={conversation.id} />
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
