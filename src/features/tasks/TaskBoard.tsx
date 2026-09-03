"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import {
  createTask,
  deleteTask,
  moveTask,
  updateTask,
  type TaskState,
} from "@/features/tasks/actions";
import { dueState, TASK_COLUMNS, type TaskStatus } from "@/features/tasks/board";
import type { ClientTask, TaskBoard as Board } from "@/features/tasks/queries";

const today = () => new Date().toISOString().slice(0, 10);

/** Where a card can go from where it is. */
const MOVES: Record<TaskStatus, { status: TaskStatus; label: string }[]> = {
  todo: [{ status: "in_progress", label: "Start" }, { status: "done", label: "Done" }],
  in_progress: [{ status: "todo", label: "Back" }, { status: "done", label: "Done" }],
  done: [{ status: "in_progress", label: "Reopen" }],
};

function DueChip({ task }: { task: ClientTask }) {
  const due = dueState(task.due_on);
  if (due.tone === "none") return null;

  // Overdue is a verdict, so it takes `negative` — the palette reserves
  // positive/negative for exactly that and treats every other hue as identity.
  // "Due soon" is attention, not judgement, so it stays on the identity blue.
  const tone =
    due.tone === "overdue"
      ? "border-negative text-negative bg-negative-wash"
      : due.tone === "soon"
        ? "border-cobalt text-cobalt-deep bg-cobalt-wash"
        : "border-ink/20 text-ink/60 bg-paper";

  return (
    <span className={`inline-block border px-2 py-0.5 font-mono text-[11px] font-semibold ${tone}`}>
      {due.label}
    </span>
  );
}

function TaskCard({ task }: { task: ClientTask }) {
  const [editing, setEditing] = useState(false);
  const [moveState, moveAction, moving] = useActionState<TaskState, FormData>(moveTask, undefined);
  const [editState, editAction, saving] = useActionState<TaskState, FormData>(updateTask, undefined);
  const [removeState, removeAction, removing] = useActionState<TaskState, FormData>(
    deleteTask,
    undefined,
  );

  if (editing) {
    return (
      <li className="border border-ink bg-paper-light px-4 py-4">
        <form action={editAction} className="space-y-3">
          <input type="hidden" name="taskId" value={task.id} />
          <div>
            <label htmlFor={`title-${task.id}`} className={labelStyles}>Task</label>
            <input
              id={`title-${task.id}`}
              name="title"
              defaultValue={task.title}
              required
              maxLength={200}
              className={fieldStyles}
            />
          </div>
          <div>
            <label htmlFor={`notes-${task.id}`} className={labelStyles}>Notes</label>
            <textarea
              id={`notes-${task.id}`}
              name="notes"
              rows={2}
              defaultValue={task.notes ?? ""}
              maxLength={2000}
              className={fieldStyles}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`due-${task.id}`} className={labelStyles}>Due</label>
              <input
                id={`due-${task.id}`}
                name="dueOn"
                type="date"
                defaultValue={task.due_on ?? ""}
                className={fieldStyles}
              />
            </div>
            <div>
              <label htmlFor={`remind-${task.id}`} className={labelStyles}>Remind me on</label>
              <input
                id={`remind-${task.id}`}
                name="remindOn"
                type="date"
                defaultValue={task.remind_on ?? ""}
                className={fieldStyles}
              />
            </div>
          </div>

          {editState && "error" in editState ? (
            <p role="alert" className="border-l-[3px] border-clay bg-clay/10 px-3 py-2 text-[13px] leading-6 text-ink">
              {editState.error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="secondary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-10 text-[13px] font-semibold text-ink/60 hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="border border-ink/15 bg-paper-light px-4 py-3">
      <p className="text-sm font-medium leading-6 text-ink">{task.title}</p>
      {task.notes ? (
        <p className="mt-1 whitespace-pre-line text-[13px] leading-6 text-ink/60">{task.notes}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <DueChip task={task} />
        {/* Only worth showing while it is still ahead of the client. Once the
            reminder has been sent, the notification itself is the record. */}
        {task.remind_on && !task.reminded_at && task.status !== "done" ? (
          <span className="font-mono text-[11px] text-ink/45">Reminder {task.remind_on}</span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3">
        {MOVES[task.status].map((move) => (
          <form action={moveAction} key={move.status}>
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="status" value={move.status} />
            <button
              type="submit"
              disabled={moving}
              className="min-h-9 border border-cobalt px-3 text-[12px] font-semibold text-cobalt hover:bg-cobalt hover:text-paper disabled:opacity-50"
            >
              {move.label}
            </button>
          </form>
        ))}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-h-9 px-2 text-[12px] font-semibold text-ink/60 hover:text-ink"
        >
          Edit
        </button>
        <form action={removeAction} className="ml-auto">
          <input type="hidden" name="taskId" value={task.id} />
          <button
            type="submit"
            disabled={removing}
            className="min-h-9 px-2 text-[12px] font-semibold text-ink/45 hover:text-clay disabled:opacity-50"
          >
            {removing ? "Removing…" : "Remove"}
          </button>
        </form>
      </div>

      {(moveState && "error" in moveState) || (removeState && "error" in removeState) ? (
        <p role="alert" className="mt-2 text-[12px] leading-5 text-clay">
          {(moveState && "error" in moveState ? moveState.error : "") ||
            (removeState && "error" in removeState ? removeState.error : "")}
        </p>
      ) : null}
    </li>
  );
}

export function TaskBoard({ board }: { board: Board }) {
  const [state, action, pending] = useActionState<TaskState, FormData>(createTask, undefined);
  const total = TASK_COLUMNS.reduce((n, c) => n + board[c.status].length, 0);

  return (
    <div className="space-y-6">
      <section className="border border-ink bg-paper-light px-5 py-5">
        <h2 className="font-heading text-2xl leading-none">Add a task</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          A reminder appears in your notifications on the morning of the date you set. Leave it
          blank and it follows the due date.
        </p>

        <form action={action} className="mt-4 space-y-4">
          <div>
            <label htmlFor="title" className={labelStyles}>Task</label>
            <input
              id="title"
              name="title"
              required
              maxLength={200}
              placeholder="Chase the outstanding invoice"
              className={fieldStyles}
            />
          </div>
          <div>
            <label htmlFor="notes" className={labelStyles}>
              Notes <span className="font-normal text-ink/45">(optional)</span>
            </label>
            <textarea id="notes" name="notes" rows={2} maxLength={2000} className={fieldStyles} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dueOn" className={labelStyles}>
                Due <span className="font-normal text-ink/45">(optional)</span>
              </label>
              <input id="dueOn" name="dueOn" type="date" min={today()} className={fieldStyles} />
            </div>
            <div>
              <label htmlFor="remindOn" className={labelStyles}>
                Remind me on <span className="font-normal text-ink/45">(optional)</span>
              </label>
              <input id="remindOn" name="remindOn" type="date" className={fieldStyles} />
              <p className={helpTextStyles}>Reminders are sent each morning, not at a set time.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-ink/30 pt-4">
            {state && "error" in state ? (
              <p role="alert" className="mr-auto text-[13px] leading-5 text-clay">{state.error}</p>
            ) : state && "ok" in state ? (
              <p role="status" className="mr-auto text-[13px] leading-5 text-teal">Task added.</p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add task"}
            </Button>
          </div>
        </form>
      </section>

      {total === 0 ? (
        <div className="border border-ink bg-paper-light px-6 py-10 text-center">
          <p className="font-heading text-2xl">Nothing on the board yet</p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink/60">
            Add the first task above. This board is yours alone — no BluBook staff member can read it.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {TASK_COLUMNS.map((column) => (
            <section key={column.status} aria-labelledby={`col-${column.status}`}>
              <div className="flex items-baseline justify-between border-b border-ink/20 pb-2">
                <h2 id={`col-${column.status}`} className="font-heading text-xl leading-none">
                  {column.label}
                </h2>
                <span className="font-mono text-[11px] tabular-nums text-ink/50">
                  {board[column.status].length}
                </span>
              </div>
              {board[column.status].length === 0 ? (
                <p className="mt-3 border border-dashed border-ink/20 px-4 py-6 text-center text-[13px] text-ink/45">
                  Nothing here
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {board[column.status].map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
