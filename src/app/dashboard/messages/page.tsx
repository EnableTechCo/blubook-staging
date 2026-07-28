import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusLabel } from "@/components/ui/StatusLabel";
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
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
          Conversations
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-[-0.03em] text-ink">
          Messages
        </h1>
        <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-slate-600">
          Direct messages about a request. The other party&apos;s identity is never shown — please
          don&apos;t share names or contact details.
        </p>
      </header>

      <div className="border border-ink/40 bg-paper-light/95">
        {threads.length === 0 ? (
          <p className="border-l-[3px] border-sun bg-paper px-4 py-3 font-body text-sm text-slate-600">
            No conversations yet.
          </p>
        ) : (
          <ul>
            {threads.map((thread) => (
              <li key={thread.id} className="border-b border-ink/12 last:border-b-0">
                <Link
                  href={`/dashboard/messages/${thread.id}`}
                  className="flex items-baseline gap-4 px-4 py-3.5 transition-colors hover:bg-cobalt-wash/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sun"
                >
                  <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-cobalt">
                    {thread.reference}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-body text-sm font-semibold text-ink">
                      {thread.title}
                    </span>
                    <span className="mt-0.5 block truncate font-body text-sm text-slate-600">
                      {thread.lastMessage ? (
                        <>
                          <span className="text-slate-500">
                            {thread.lastMessage.sender_id === profile.id
                              ? "You"
                              : ROLE_LABEL[thread.lastMessage.sender_role] ??
                                thread.lastMessage.sender_role}
                            :{" "}
                          </span>
                          {thread.lastMessage.body}
                        </>
                      ) : (
                        <span className="italic text-slate-400">No messages yet</span>
                      )}
                    </span>
                  </span>

                  <span className="hidden shrink-0 sm:block">
                    <StatusLabel status={thread.status} />
                  </span>

                  <span className="w-14 shrink-0 text-right font-mono text-[10px] text-slate-500">
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
