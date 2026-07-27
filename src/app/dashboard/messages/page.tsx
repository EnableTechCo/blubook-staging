import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";
import { getMessagingThreads, type MessageThread } from "@/services/dashboard";
import { sendMessage } from "@/features/messages/actions";
import { Empty, Section } from "@/features/dashboard/ui";

export const metadata: Metadata = { title: "Messages · BluBook" };
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  client: "Client",
  provider: "Provider",
  staff: "BluBook staff",
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MessagesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const isStaff = profile.user_type === "staff";
  let threads = await getMessagingThreads();
  // Staff only need to see conversations that actually have messages.
  if (isStaff) threads = threads.filter((t) => t.request_messages.length > 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-sky-700">Messages</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Conversations</h1>
        <p className="mt-1 text-sm text-slate-600">
          Direct messages about a request. The other party&apos;s identity is never shown — please
          don&apos;t share names or contact details.
        </p>
      </header>

      {threads.length === 0 ? (
        <Empty>No conversations yet.</Empty>
      ) : (
        threads.map((t) => <Thread key={t.id} thread={t} currentUserId={profile.id} />)
      )}
    </div>
  );
}

function Thread({ thread, currentUserId }: { thread: MessageThread; currentUserId: string }) {
  const messages = [...thread.request_messages].sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <Section title={thread.reference} subtitle={thread.title}>
      {messages.length === 0 ? (
        <Empty>No messages yet — start the conversation.</Empty>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <li key={m.id} className={mine ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[80%] rounded-md px-3 py-2 text-sm ${
                    mine ? "bg-sky-700 text-white" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className={`mb-0.5 text-xs ${mine ? "text-sky-100" : "text-slate-500"}`}>
                    {mine ? "You" : ROLE_LABEL[m.sender_role] ?? m.sender_role} · {when(m.created_at)}
                  </div>
                  {m.body}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form action={sendMessage} className="mt-4 flex items-end gap-2 border-t border-slate-200 pt-4">
        <input type="hidden" name="requestId" value={thread.id} />
        <textarea
          name="body"
          required
          rows={2}
          placeholder="Write a message…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
        >
          Send
        </button>
      </form>
    </Section>
  );
}
