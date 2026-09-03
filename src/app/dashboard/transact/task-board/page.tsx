import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { TaskBoard } from "@/features/tasks/TaskBoard";
import { getTaskBoard } from "@/features/tasks/queries";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Task Board · BluBook" };
export const dynamic = "force-dynamic";

export default async function TaskBoardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  // The board is the client's own. The RLS policy is the real boundary, but a
  // staff member should not reach a page that would only ever be empty.
  if (profile.user_type !== "client") redirect("/dashboard");

  const board = await getTaskBoard();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Transact"
        title="Task Board"
        description="Your own working list, with reminders. Nothing here is routed to a partner or read by BluBook staff."
      />
      <TaskBoard board={board} />
    </div>
  );
}
