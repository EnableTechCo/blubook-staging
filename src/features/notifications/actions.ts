"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Mark a single notification read. RLS scopes the update to the caller's own rows.
export async function markNotificationRead(formData: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id.data);
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard", "layout");
}

// Mark all of the caller's unread notifications read.
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard", "layout");
}
