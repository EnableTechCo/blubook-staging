import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { Empty, WorkspaceHeader } from "@/features/dashboard/ui";
import { getThreadSummaries } from "@/services/dashboard";
import { getCurrentProfile } from "@/services/profiles";
import { inboxTime, ROLE_LABEL } from "@/features/messages/ui";

export const metadata: Metadata = { title: "Messages · BluBook" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  let threads = await getThreadSummaries();
  // Staff observe conversations rather than start them, so only show live ones.
  if (profile.user_type === "staff") threads = threads.filter((t) => t.messageCount > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Conversations"
        title="Messages"
        description="Direct messages about a request. The other party's identity is never shown — please don't share names or contact details."
      />

      <div className="border-y border-ink bg-paper">
        {threads.length === 0 ? (
          <div className="p-5">
            <Empty>No conversations yet.</Empty>
          </div>
        ) : (
          <ul>
            {threads.map((thread) => (
              <li key={thread.id} className="border-b border-ink last:border-b-0">
                <Link
                  href={`/dashboard/messages/${thread.id}`}
                  className="flex items-baseline gap-4 px-4 py-4 transition-colors hover:bg-cream/45 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rust"
                >
                  <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-rust">
                    {thread.reference}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-body text-sm font-semibold text-ink">
                      {thread.title}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-ink/60">
                      {thread.lastMessage ? (
                        <>
                          <span className="text-ink/45">
                            {thread.lastMessage.sender_id === profile.id
                              ? "You"
                              : ROLE_LABEL[thread.lastMessage.sender_role] ??
                                thread.lastMessage.sender_role}
                            :{" "}
                          </span>
                          {thread.lastMessage.body}
                        </>
                      ) : (
                        <span className="italic text-ink/35">No messages yet</span>
                      )}
                    </span>
                  </span>

                  <span className="hidden shrink-0 sm:block">
                    <StatusLabel status={thread.status} />
                  </span>

                  <span className="w-14 shrink-0 text-right font-mono text-[10px] text-ink/45">
                    {thread.lastMessage ? inboxTime(thread.lastMessage.created_at) : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
