import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { TaskStatus } from "@/features/tasks/board";

export type ClientTask = Pick<
  Tables<"client_tasks">,
  | "id"
  | "title"
  | "notes"
  | "status"
  | "due_on"
  | "remind_on"
  | "reminded_at"
  | "position"
  | "completed_at"
  | "updated_at"
>;

export type TaskBoard = Record<TaskStatus, ClientTask[]>;

/**
 * The signed-in client's board, already grouped into its columns.
 *
 * Grouping here rather than in the component keeps the page a plain render of
 * what it was handed, and means an empty column is an empty array rather than
 * something the view has to invent.
 */
export async function getTaskBoard(): Promise<TaskBoard> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_tasks")
    .select(
      "id,title,notes,status,due_on,remind_on,reminded_at,position,completed_at,updated_at",
    )
    .order("position", { ascending: false })
    .order("created_at", { ascending: false });

  const board: TaskBoard = { todo: [], in_progress: [], done: [] };
  for (const task of data ?? []) board[task.status].push(task);
  return board;
}
