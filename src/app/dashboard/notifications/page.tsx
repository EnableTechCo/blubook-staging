import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Empty, WorkspaceHeader } from "@/features/dashboard/ui";
import { getCurrentProfile } from "@/services/profiles";
import { getNotifications, type NotificationRow } from "@/services/dashboard";
import { markAllNotificationsRead, markNotificationRead } from "@/features/notifications/actions";
import { messageTime } from "@/features/messages/ui";

export const metadata: Metadata = { title: "Notifications · BluBook" };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<NotificationRow["type"], string> = {
  request_status: "Request update",
  document_expiry: "Document expiry",
};

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const notifications = await getNotifications();
  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <WorkspaceHeader
        eyebrow={unread > 0 ? `${unread} unread` : "All caught up"}
        title="Notifications"
        description="Status changes on your requests and document reminders."
        aside={unread > 0 ? (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="secondary">
              Mark all read
            </Button>
          </form>
        ) : null}
      />

      <div className="border-y border-ink bg-paper">
        {notifications.length === 0 ? (
          <div className="p-5">
            <Empty>No notifications yet.</Empty>
          </div>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-4 border-b border-ink px-4 py-4 last:border-b-0 ${
                  n.read_at ? "" : "border-l-[3px] border-l-[#F2D77A] bg-cream/35"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-rust">
                      {TYPE_LABEL[n.type]}
                    </span>
                    <span className="font-mono text-[10px] text-ink/45">
                      {messageTime(n.created_at)}
                    </span>
                  </div>
                  <p
                    className={`mt-1.5 font-body text-sm text-ink ${
                      n.read_at ? "" : "font-semibold"
                    }`}
                  >
                    {n.title}
                  </p>
                  {n.body ? (
                    <p className="mt-0.5 text-sm leading-6 text-ink/60">{n.body}</p>
                  ) : null}
                  {n.request_id ? (
                    <Link
                      href={`/dashboard/messages/${n.request_id}`}
                      className="mt-2 inline-block border-b border-ink text-xs font-semibold text-ink hover:border-rust hover:text-rust"
                    >
                      Open conversation
                    </Link>
                  ) : null}
                </div>

                {!n.read_at ? (
                  <form action={markNotificationRead} className="shrink-0">
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      className="text-xs font-semibold text-rust hover:text-ink hover:underline"
                    >
                      Mark read
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
