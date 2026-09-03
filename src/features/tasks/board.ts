import type { Enums } from "@/types/database";

/**
 * The board's pure logic, with no imports that reach a server.
 *
 * Kept apart from queries.ts deliberately: that module is "server-only", and
 * the board is a client component. Anything it needs at runtime — the column
 * list, the due-date wording — has to live somewhere a client can import
 * without dragging the Supabase client and its environment in with it.
 */

export type TaskStatus = Enums<"task_status">;

/** The three columns, in the order they are read. */
export const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "in_progress", label: "In progress" },
  { status: "done", label: "Done" },
];

export type DueTone = "overdue" | "soon" | "later" | "none";

/** How a due date reads on a card, and whether it should look urgent. */
export function dueState(
  dueOn: string | null,
  today = new Date(),
): { label: string; tone: DueTone } {
  if (!dueOn) return { label: "", tone: "none" };

  // Compared as whole days, because the column is a date. Both sides are put
  // on UTC midnight so the hour of day cannot change the verdict — otherwise a
  // task reads "due tomorrow" on the morning it is actually due.
  const due = Date.parse(`${dueOn}T00:00:00Z`);
  if (Number.isNaN(due)) return { label: "", tone: "none" };

  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((due - now) / 86_400_000);

  if (days < 0) {
    return { label: days === -1 ? "1 day overdue" : `${-days} days overdue`, tone: "overdue" };
  }
  if (days === 0) return { label: "Due today", tone: "soon" };
  if (days === 1) return { label: "Due tomorrow", tone: "soon" };
  if (days <= 7) return { label: `Due in ${days} days`, tone: "soon" };
  return { label: `Due ${dueOn}`, tone: "later" };
}
