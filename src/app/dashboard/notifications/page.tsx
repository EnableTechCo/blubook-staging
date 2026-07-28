import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
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
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-medium tracking-[-0.03em] text-ink">
            Notifications
          </h1>
          <p className="mt-2 font-body text-sm leading-6 text-slate-600">
            Status changes on your requests and document reminders.
          </p>
        </div>
        {unread > 0 ? (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="secondary">
              Mark all read
            </Button>
          </form>
        ) : null}
      </header>

      <div className="border border-ink/40 bg-paper-light/95">
        {notifications.length === 0 ? (
          <p className="border-l-[3px] border-sun bg-paper px-4 py-3 font-body text-sm text-slate-600">
            No notifications yet.
          </p>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-4 border-b border-ink/12 px-4 py-4 last:border-b-0 ${
                  n.read_at ? "" : "border-l-[3px] border-l-sun bg-paper/60"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-cobalt">
                      {TYPE_LABEL[n.type]}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
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
                    <p className="mt-0.5 font-body text-sm leading-6 text-slate-600">{n.body}</p>
                  ) : null}
                  {n.request_id ? (
                    <Link
                      href={`/dashboard/messages/${n.request_id}`}
                      className="mt-2 inline-block border-b border-ink font-body text-xs font-semibold text-ink hover:border-cobalt hover:text-cobalt"
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
                      className="font-body text-xs font-semibold text-cobalt hover:text-cobalt-deep hover:underline"
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
