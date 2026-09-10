import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

/** Request-thread messaging: the inbox and a single conversation. */

interface MessageThread {
  id: string;
  reference: string;
  title: string;
  status: Enums<"request_status">;
  request_messages: {
    id: string;
    body: string;
    sender_role: Enums<"message_sender_role">;
    sender_id: string | null;
    created_at: string;
  }[];
}

interface ThreadSummary {
  id: string;
  reference: string;
  title: string;
  status: Enums<"request_status">;
  messageCount: number;
  lastMessage: MessageThread["request_messages"][number] | null;
}

// Conversations the caller can take part in, each with its messages. RLS scopes
// the requests (client's own / provider's assigned / staff all).
//
// A thread qualifies when it has an assigned provider — so a counterpart exists
// to talk to — or when someone has already posted to it. The second case covers
// requests BluBook raises and answers itself, such as the onboarding welcome,
// which has no partner but is a real conversation.
//
// Not exported: its only consumer is getThreadSummaries below. It was exported
// from the old module, where nothing else used it either.
async function getMessagingThreads(): Promise<MessageThread[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_requests")
    .select(
      "id,reference,title,status,provider_id,request_messages(id,body,sender_role,sender_id,created_at)",
    )
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<(MessageThread & { provider_id: string | null })[]>();

  return (data ?? [])
    .filter((thread) => thread.provider_id !== null || thread.request_messages.length > 0)
    .map(({ provider_id: _providerId, ...thread }) => thread);
}

// Inbox view: one row per conversation with its latest message, newest activity
// first (threads with no messages fall to the bottom).
export async function getThreadSummaries(): Promise<ThreadSummary[]> {
  const threads = await getMessagingThreads();

  return threads
    .map((t) => {
      const ordered = [...t.request_messages].sort((a, b) =>
        a.created_at.localeCompare(b.created_at),
      );
      return {
        id: t.id,
        reference: t.reference,
        title: t.title,
        status: t.status,
        messageCount: ordered.length,
        lastMessage: ordered.at(-1) ?? null,
      };
    })
    .sort((a, b) => {
      const aAt = a.lastMessage?.created_at ?? "";
      const bAt = b.lastMessage?.created_at ?? "";
      return bAt.localeCompare(aAt);
    });
}

// A single conversation, or null when the caller cannot see that request.
export async function getThread(requestId: string): Promise<MessageThread | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_requests")
    .select("id,reference,title,status,request_messages(id,body,sender_role,sender_id,created_at)")
    .eq("id", requestId)
    .maybeSingle<MessageThread>();
  return data;
}
