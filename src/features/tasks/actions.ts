"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

export type TaskState = { error: string } | { ok: true } | undefined;

const BOARD_PATH = "/dashboard/transact/task-board";

const optionalDate = z
  .string()
  .trim()
  .max(10)
  .optional()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), "That date is not valid.");

const taskSchema = z
  .object({
    title: z.string().trim().min(1, "A task needs a title.").max(200),
    notes: z.string().trim().max(2000).optional().transform((v) => (v ? v : null)),
    dueOn: optionalDate,
    remindOn: optionalDate,
  })
  // The database rejects this too. Catching it here turns a constraint
  // violation into a sentence the client can act on.
  .refine((v) => !v.remindOn || !v.dueOn || v.remindOn <= v.dueOn, {
    message: "A reminder cannot fall after the task is due.",
    path: ["remindOn"],
  });

const statusSchema = z.enum(["todo", "in_progress", "done"]);

/** The signed-in client, or a message saying why there isn't one. */
async function currentClient(): Promise<{ id: string } | string> {
  const profile = await getCurrentProfile();
  if (!profile) return "Not authenticated.";
  if (profile.user_type !== "client") return "Only a client keeps a task board.";

  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("primary_profile_id", profile.id)
    .maybeSingle();

  if (!data) return "No client record is linked to this account.";
  return { id: data.id };
}

export async function createTask(_: TaskState, formData: FormData): Promise<TaskState> {
  const client = await currentClient();
  if (typeof client === "string") return { error: client };

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    notes: formData.get("notes") ?? undefined,
    dueOn: formData.get("dueOn") ?? undefined,
    remindOn: formData.get("remindOn") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "That task could not be saved." };
  }

  const supabase = await createClient();

  // New tasks land at the top of their column. Reading the current maximum
  // costs one query and avoids renumbering every sibling on each insert.
  const { data: top } = await supabase
    .from("client_tasks")
    .select("position")
    .eq("status", "todo")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("client_tasks").insert({
    client_id: client.id,
    title: parsed.data.title,
    notes: parsed.data.notes,
    due_on: parsed.data.dueOn,
    // Defaulting the reminder to the due date is what makes the field worth
    // having: a client who sets a deadline has already said when to be told.
    remind_on: parsed.data.remindOn ?? parsed.data.dueOn,
    position: (top?.position ?? 0) + 1,
  });

  // Surface the database's own message, as the rest of the actions in this
  // codebase do. A generic sentence here hid a missing table behind the same
  // wording a validation failure would have used.
  if (error) return { error: error.message };

  revalidatePath(BOARD_PATH);
  return { ok: true };
}

export async function updateTask(_: TaskState, formData: FormData): Promise<TaskState> {
  const client = await currentClient();
  if (typeof client === "string") return { error: client };

  const id = z.string().uuid().safeParse(formData.get("taskId"));
  if (!id.success) return { error: "That task could not be found." };

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    notes: formData.get("notes") ?? undefined,
    dueOn: formData.get("dueOn") ?? undefined,
    remindOn: formData.get("remindOn") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "That task could not be saved." };
  }

  const supabase = await createClient();
  // No client_id filter: RLS is the boundary, and adding one here would imply
  // the policy is not trusted to hold. The count is what proves it did.
  const { data, error } = await supabase
    .from("client_tasks")
    .update({
      title: parsed.data.title,
      notes: parsed.data.notes,
      due_on: parsed.data.dueOn,
      remind_on: parsed.data.remindOn ?? parsed.data.dueOn,
    })
    .eq("id", id.data)
    .select("id");

  if (error) return { error: error.message };
  if (!data?.length) return { error: "That task could not be found." };

  revalidatePath(BOARD_PATH);
  return { ok: true };
}

export async function moveTask(_: TaskState, formData: FormData): Promise<TaskState> {
  const client = await currentClient();
  if (typeof client === "string") return { error: client };

  const id = z.string().uuid().safeParse(formData.get("taskId"));
  const status = statusSchema.safeParse(formData.get("status"));
  if (!id.success || !status.success) return { error: "That move could not be made." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_tasks")
    .update({ status: status.data })
    .eq("id", id.data)
    .select("id");

  if (error) return { error: error.message };
  if (!data?.length) return { error: "That task could not be found." };

  revalidatePath(BOARD_PATH);
  return { ok: true };
}

export async function deleteTask(_: TaskState, formData: FormData): Promise<TaskState> {
  const client = await currentClient();
  if (typeof client === "string") return { error: client };

  const id = z.string().uuid().safeParse(formData.get("taskId"));
  if (!id.success) return { error: "That task could not be found." };

  const supabase = await createClient();
  const { error } = await supabase.from("client_tasks").delete().eq("id", id.data);
  if (error) return { error: error.message };

  revalidatePath(BOARD_PATH);
  return { ok: true };
}
