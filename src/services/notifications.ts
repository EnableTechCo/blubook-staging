import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

export interface NotificationRow {
  id: string;
  type: Enums<"notification_type">;
  /** Urgent notifications lead the page and are the only ones the bell counts. */
  urgent: boolean;
  title: string;
  body: string | null;
  request_id: string | null;
  document_id: string | null;
  read_at: string | null;
  created_at: string;
}

// The caller's notifications (RLS-scoped to recipient), newest first.
export async function getNotifications(): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id,type,urgent,title,body,request_id,document_id,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<NotificationRow[]>();
  return data ?? [];
}

/**
 * What the bell counts.
 *
 * Urgent only, deliberately. Overdue requests still raise notifications and
 * still appear on the notifications page — they just do not ring the bell,
 * because a bell that lights up for every late request stops meaning anything.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("urgent", true)
    .is("read_at", null);
  return count ?? 0;
}
