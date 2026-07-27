"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

const schema = z.object({
  requestId: z.string().uuid(),
  body: z.string().trim().min(1, "Message cannot be empty").max(2000),
});

const roleFor = { client: "client", service_provider: "provider", staff: "staff" } as const;

// Post a message to a request thread. The sender is always the current user;
// RLS enforces that they are a participant (client, assigned provider, or staff).
export async function sendMessage(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;
  const senderRole = roleFor[profile.user_type];
  if (!senderRole) return;

  const parsed = schema.safeParse({
    requestId: formData.get("requestId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("request_messages").insert({
    request_id: parsed.data.requestId,
    sender_id: profile.id,
    sender_role: senderRole,
    body: parsed.data.body,
  });

  revalidatePath("/dashboard/messages");
}
