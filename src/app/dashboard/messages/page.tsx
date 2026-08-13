import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { Empty, WorkspaceHeader } from "@/features/dashboard/ui";
import {
  getAddressableWorkGroups,
  getThreadSummaries,
  getWorkGroupConversations,
} from "@/services/dashboard";
import { getCurrentProfile } from "@/services/profiles";
import { inboxTime, ROLE_LABEL } from "@/features/messages/ui";
import { NewWorkGroupConversation } from "@/features/messages/NewWorkGroupConversation";

export const metadata: Metadata = { title: "Messages · BluBook" };
export const dynamic = "force-dynamic";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const isClient = profile.user_type === "client";
  const [threadList, groupConversations, workGroups, { error }] = await Promise.all([
    getThreadSummaries(),
    getWorkGroupConversations(),
    isClient ? getAddressableWorkGroups() : Promise.resolve([]),
    searchParams,
  ]);

  let threads = threadList;
  // Staff observe conversations rather than start them, so only show live ones.
  if (profile.user_type === "staff") threads = threads.filter((t) => t.messageCount > 0);

  const latestOf = (conversation: (typeof groupConversations)[number]) =>
    [...conversation.work_group_messages].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    )[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Conversations"
        title="Messages"
        description="Direct messages about a request. The other party's identity is never shown — please don't share names or contact details."
      />

      {error ? (
        <p
          role="alert"
          className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink"
        >
          {error}
        </p>
      ) : null}

      {isClient ? <NewWorkGroupConversation workGroups={workGroups} /> : null}

      {groupConversations.length > 0 ? (
        <section>
          <h2 className="mb-3 font-heading text-2xl font-normal text-ink">Work groups</h2>
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/75 shadow-surface">
            <ul>
              {groupConversations.map((conversation) => {
                const latest = latestOf(conversation);
                return (
                  <li key={conversation.id} className="border-b border-ink/8 last:border-b-0">
                    <Link
                      href={`/dashboard/messages/group/${conversation.id}`}
                      className="flex items-baseline gap-4 px-4 py-4 transition-colors hover:bg-cobalt-wash/40 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt"
                    >
                      <span className="w-24 shrink-0 truncate text-[10px] uppercase tracking-[0.1em] text-rust">
                        {conversation.service_groups?.name ?? "Work group"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-body text-sm font-semibold text-ink">
                          {conversation.subject}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-ink/60">
                          {latest ? (
                            <>
                              <span className="text-ink/45">
                                {latest.sender_id === profile.id
                                  ? "You"
                                  : ROLE_LABEL[latest.sender_role] ?? latest.sender_role}
                                :{" "}
                              </span>
                              {latest.body}
                            </>
                          ) : (
                            <span className="italic text-ink/35">No messages yet</span>
                          )}
                        </span>
                      </span>
                      <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.1em] text-ink/45 sm:block">
                        {conversation.assigned_provider_id ? "Assigned" : "Unassigned"}
                      </span>
                      <span className="w-14 shrink-0 text-right font-mono text-[10px] text-ink/45">
                        {latest ? inboxTime(latest.created_at) : "—"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {groupConversations.length > 0 ? (
        <h2 className="font-heading text-2xl font-normal text-ink">Requests</h2>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/75 shadow-surface">
        {threads.length === 0 ? (
          <div className="p-5">
            <Empty>No conversations yet.</Empty>
          </div>
        ) : (
          <ul>
            {threads.map((thread) => (
              <li key={thread.id} className="border-b border-ink/8 last:border-b-0">
                <Link
                  href={`/dashboard/messages/${thread.id}`}
                  className="flex items-baseline gap-4 px-4 py-4 transition-colors hover:bg-cobalt-wash/40 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt"
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
