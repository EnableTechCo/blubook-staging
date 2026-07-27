import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";
import { getNotifications } from "@/services/dashboard";
import { markAllNotificationsRead, markNotificationRead } from "@/features/notifications/actions";
import { Empty, Section } from "@/features/dashboard/ui";

export const metadata: Metadata = { title: "Notifications · BluBook" };
export const dynamic = "force-dynamic";

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const notifications = await getNotifications();
  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-700">Notifications</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Updates{unread > 0 ? ` · ${unread} unread` : ""}
          </h1>
        </div>
        {unread > 0 ? (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Mark all read
            </button>
          </form>
        ) : null}
      </header>

      <Section title="Recent" subtitle="Status changes and document reminders">
        {notifications.length === 0 ? (
          <Empty>No notifications yet.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 py-3">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-sky-600"}`}
                  />
                  <div>
                    <p className={`text-sm ${n.read_at ? "text-slate-600" : "font-medium text-slate-900"}`}>
                      {n.title}
                    </p>
                    {n.body ? <p className="text-sm text-slate-500">{n.body}</p> : null}
                    <p className="mt-0.5 text-xs text-slate-400">{when(n.created_at)}</p>
                  </div>
                </div>
                {!n.read_at ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button type="submit" className="text-xs font-medium text-sky-700 hover:underline">
                      Mark read
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
