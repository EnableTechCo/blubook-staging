"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

const roleFor = { client: "client", service_provider: "provider", staff: "staff" } as const;

const startSchema = z.object({
  workGroupId: z.string().uuid("Choose a work group"),
  subject: z.string().trim().min(1, "Give the conversation a subject").max(200),
  body: z.string().trim().min(1, "Write a message").max(2000),
});

// A client opens a conversation with a work group. The partner who picks it up
// is chosen by the database trigger, so nothing here selects one — the client
// never learns who reads it.
export async function startWorkGroupConversation(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.user_type !== "client") return;

  const parsed = startSchema.safeParse({
    workGroupId: formData.get("workGroupId"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    redirect(
      `/dashboard/messages?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input")}`,
    );
  }

  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("id").maybeSingle();
  if (!client) {
    redirect(
      `/dashboard/messages?error=${encodeURIComponent("No client account is linked to your profile.")}`,
    );
  }

  const { data: conversation, error } = await supabase
    .from("work_group_conversations")
    .insert({
      client_id: client.id,
      work_group_id: parsed.data.workGroupId,
      subject: parsed.data.subject,
    })
    .select("id")
    .single();

  if (error || !conversation) {
    redirect(
      `/dashboard/messages?error=${encodeURIComponent(error?.message ?? "Could not start the conversation.")}`,
    );
  }

  await supabase.from("work_group_messages").insert({
    conversation_id: conversation.id,
    sender_id: profile.id,
    sender_role: "client",
    body: parsed.data.body,
  });

  revalidatePath("/dashboard/messages");
  redirect(`/dashboard/messages/group/${conversation.id}`);
}

// Post to an existing work group conversation. RLS allows only the client, the
// assigned partner, or staff.
export async function sendWorkGroupMessage(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;
  const senderRole = roleFor[profile.user_type];
  if (!senderRole) return;

  const parsed = z
    .object({
      conversationId: z.string().uuid(),
      body: z.string().trim().min(1).max(2000),
    })
    .safeParse({
      conversationId: formData.get("conversationId"),
      body: formData.get("body"),
    });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("work_group_messages").insert({
    conversation_id: parsed.data.conversationId,
    sender_id: profile.id,
    sender_role: senderRole,
    body: parsed.data.body,
  });

  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/group/${parsed.data.conversationId}`);
}
