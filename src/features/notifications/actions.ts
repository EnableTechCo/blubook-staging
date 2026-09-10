"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formUuid } from "@/lib/validation/form";
import { ROUTES } from "@/lib/routes";

// Mark a single notification read. RLS scopes the update to the caller's own rows.
export async function markNotificationRead(formData: FormData): Promise<void> {
  const id = formUuid(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(ROUTES.notifications);
  revalidatePath(ROUTES.dashboard, "layout");
}

// Mark all of the caller's unread notifications read.
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  revalidatePath(ROUTES.notifications);
  revalidatePath(ROUTES.dashboard, "layout");
}
