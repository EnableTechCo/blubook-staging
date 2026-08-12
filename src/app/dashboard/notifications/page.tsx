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
  request_status: "Request updates",
  document_expiry: "Document expiry",
  compliance_review: "Compliance reviews",
  compliance_ratio: "Compliance ratio",
};

// The order groups appear in when nothing is urgent. Request updates are the
// bulk of the list and go last, so the rarer things are not buried under them.
const TYPE_ORDER: NotificationRow["type"][] = [
  "compliance_ratio",
  "compliance_review",
  "document_expiry",
  "request_status",
];

function NotificationItem({
  notification,
  staff,
  urgent,
}: {
  notification: NotificationRow;
  staff: boolean;
  urgent: boolean;
}) {
  const unread = !notification.read_at;

  return (
    <li
      className={`flex items-start gap-4 border-b border-ink px-4 py-4 last:border-b-0 ${
        urgent
          ? unread
            ? "border-l-[3px] border-l-negative bg-negative-wash"
            : "border-l-[3px] border-l-negative/40"
          : unread
            ? "border-l-[3px] border-l-sun bg-cream/35"
            : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          {urgent ? (
            <span className="border border-negative px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-negative">
              Urgent
            </span>
          ) : null}
          <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-rust">
            {TYPE_LABEL[notification.type]}
          </span>
          <span className="font-mono text-[10px] text-ink/45">
            {messageTime(notification.created_at)}
          </span>
        </div>

        <p className={`mt-1.5 font-body text-sm ${unread ? "font-semibold" : ""} ${urgent ? "text-negative" : "text-ink"}`}>
          {notification.title}
        </p>
        {notification.body ? (
          <p className="mt-0.5 text-sm leading-6 text-ink/60">{notification.body}</p>
        ) : null}

        {staff && notification.type === "compliance_review" && notification.document_id ? (
          <Link
            href={`/dashboard/onboardings#document-${notification.document_id}`}
            className="mt-2 inline-block border-b border-ink text-xs font-semibold text-ink hover:border-rust hover:text-rust"
          >
            Review document
          </Link>
        ) : notification.request_id ? (
          <Link
            href={`/dashboard/messages/${notification.request_id}`}
            className="mt-2 inline-block border-b border-ink text-xs font-semibold text-ink hover:border-rust hover:text-rust"
          >
            Open conversation
          </Link>
        ) : null}
      </div>

      {unread ? (
        <form action={markNotificationRead} className="shrink-0">
          <input type="hidden" name="id" value={notification.id} />
          <button
            type="submit"
            className="text-xs font-semibold text-rust hover:text-ink hover:underline"
          >
            Mark read
          </button>
        </form>
      ) : null}
    </li>
  );
}

/**
 * Urgent is a plain section: it is never collapsed, because the whole reason it
 * is separated out is that it should be impossible to scroll past.
 */
function UrgentGroup({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
  return (
    <section className="border-y border-ink bg-paper">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink bg-negative-wash px-4 py-3">
        <h2 className="font-heading text-[1.3rem] leading-none text-negative">Urgent</h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-negative">{subtitle}</p>
      </div>
      <ul>{children}</ul>
    </section>
  );
}

/**
 * Everything else collapses, closed by default.
 *
 * Fifty request updates in one list is not information, it is a wall. The
 * heading carries the unread count, so a collapsed group still tells you
 * whether it is worth opening — nothing is hidden that you would need to
 * expand the group to discover.
 */
function CollapsibleGroup({
  title,
  subtitle,
  unread,
  children,
}: {
  title: string;
  subtitle: string;
  unread: number;
  children: React.ReactNode;
}) {
  return (
    <details className="border-y border-ink bg-paper">
      <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-3 border-b border-ink bg-cream/30 px-4 py-3 hover:bg-cream/60 [&::-webkit-details-marker]:hidden">
        <h2 className="font-heading text-[1.3rem] leading-none text-ink">
          {title}
          {unread > 0 ? (
            <span className="ml-3 border border-cobalt px-1.5 py-0.5 align-middle font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-cobalt">
              {unread} unread
            </span>
          ) : null}
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
          {subtitle} · show
        </p>
      </summary>
      <ul>{children}</ul>
    </details>
  );
}

/**
 * Urgent first, then everything else by kind.
 *
 * A flat list newest-first buried a compliance warning under forty request
 * updates. Urgency is not a kind of notification — a request update can be
 * urgent — so it is its own section above the groups rather than one of them,
 * and it is the one place on this page that uses red.
 */
export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const notifications = await getNotifications();
  const unread = notifications.filter((notification) => !notification.read_at).length;

  const urgent = notifications.filter((notification) => notification.urgent);
  const rest = notifications.filter((notification) => !notification.urgent);
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    items: rest.filter((notification) => notification.type === type),
  })).filter((group) => group.items.length > 0);

  const unreadIn = (items: NotificationRow[]) => items.filter((item) => !item.read_at).length;
  const summary = (items: NotificationRow[]) =>
    `${items.length} notification${items.length === 1 ? "" : "s"}`;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <WorkspaceHeader
        eyebrow={unread > 0 ? `${unread} unread` : "All caught up"}
        title="Notifications"
        description="Anything urgent comes first. Everything else is grouped by what it is about."
        aside={
          unread > 0 ? (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="secondary">
                Mark all read
              </Button>
            </form>
          ) : null
        }
      />

      {notifications.length === 0 ? (
        <div className="border-y border-ink bg-paper p-5">
          <Empty>No notifications yet.</Empty>
        </div>
      ) : (
        <div className="space-y-8">
          {urgent.length > 0 ? (
            <UrgentGroup subtitle={summary(urgent)}>
              {urgent.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  staff={profile.user_type === "staff"}
                  urgent
                />
              ))}
            </UrgentGroup>
          ) : null}

          {grouped.map((group) => (
            <CollapsibleGroup
              key={group.type}
              title={TYPE_LABEL[group.type]}
              subtitle={summary(group.items)}
              unread={unreadIn(group.items)}
            >
              {group.items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  staff={profile.user_type === "staff"}
                  urgent={false}
                />
              ))}
            </CollapsibleGroup>
          ))}
        </div>
      )}
    </div>
  );
}
