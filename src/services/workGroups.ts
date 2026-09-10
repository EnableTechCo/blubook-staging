import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

/** Work-group conversations and the groups a client may address. */

interface WorkGroupConversation {
  id: string;
  subject: string;
  created_at: string;
  assigned_provider_id: string | null;
  service_groups: { name: string } | null;
  work_group_messages: {
    id: string;
    body: string;
    sender_role: Enums<"message_sender_role">;
    sender_id: string | null;
    created_at: string;
  }[];
}

// One column list for both the list and the detail, so the two views cannot
// drift apart and show different fields for the same conversation.
const WORK_GROUP_CONVERSATION_COLUMNS =
  "id,subject,created_at,assigned_provider_id,service_groups(name),work_group_messages(id,body,sender_role,sender_id,created_at)" as const;

// Conversations addressed to a work group. RLS scopes them: a client sees its
// own, the assigned partner sees those handed to it, staff see all.
export async function getWorkGroupConversations(): Promise<WorkGroupConversation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_group_conversations")
    .select(WORK_GROUP_CONVERSATION_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<WorkGroupConversation[]>();
  return data ?? [];
}

// A single conversation, or null when the caller may not see it.
export async function getWorkGroupConversation(
  id: string,
): Promise<WorkGroupConversation | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_group_conversations")
    .select(WORK_GROUP_CONVERSATION_COLUMNS)
    .eq("id", id)
    .maybeSingle<WorkGroupConversation>();
  return data;
}

// Work groups a client can address. Names only — never their membership.
export async function getAddressableWorkGroups(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_groups")
    .select("id,name")
    .eq("active", true)
    .order("name")
    .returns<{ id: string; name: string }[]>();
  return data ?? [];
}
