import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";
import { requireStaffRoute } from "@/services/staffRole";
import { getInvitations, type InvitationRow } from "@/services/invitations";
import { InviteClientForm } from "@/features/onboarding/InviteClientForm";
import { InvitationRowActions } from "@/features/onboarding/InvitationRowActions";
import type { InvitationStatus } from "@/features/onboarding/invitations";
import { Empty, Section, WorkspaceHeader } from "@/components/ui/Workspace";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Invite a client · BluBook" };
export const dynamic = "force-dynamic";

const STATUS: Record<InvitationStatus, { label: string; className: string }> = {
  open: { label: "Waiting for the client", className: "border-cobalt/30 bg-cobalt-wash text-cobalt-deep" },
  in_use: { label: "Being completed", className: "border-cobalt/30 bg-cobalt-wash text-cobalt-deep" },
  accepted: { label: "Completed", className: "border-teal/30 bg-teal/10 text-teal" },
  expired: { label: "Expired", className: "border-ink/15 bg-paper text-ink/55" },
  revoked: { label: "Withdrawn", className: "border-ink/15 bg-paper text-ink/55" },
};

function StatusPill({ status }: { status: InvitationStatus }) {
  const { label, className } = STATUS[status];
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  );
}

function InvitationItem({ invitation }: { invitation: InvitationRow }) {
  return (
    <li className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <p className="truncate text-sm font-semibold text-ink">{invitation.business_name ?? invitation.email}</p>
          <StatusPill status={invitation.status} />
        </div>
        {invitation.business_name ? <p className="mt-1 text-xs text-ink/60">{invitation.email}</p> : null}
        <p className="mt-1 text-xs text-ink/55">
          Invited {formatDate(invitation.created_at)}
          {invitation.inviter ? ` by ${invitation.inviter}` : ""}
          {invitation.status === "open" || invitation.status === "in_use"
            ? ` · expires ${formatDate(invitation.expires_at)}`
            : ""}
          {invitation.status === "open" && !invitation.sent_at ? " · email not sent" : ""}
        </p>
        {invitation.client ? (
          <Link
            href={`/dashboard/customers/${invitation.client.id}`}
            className="mt-2 inline-block text-xs font-semibold text-cobalt hover:underline"
          >
            {invitation.client.business_name} →
          </Link>
        ) : null}
      </div>
      <InvitationRowActions invitationId={invitation.id} email={invitation.email} status={invitation.status} />
    </li>
  );
}

export default async function InviteClientPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (await requireStaffRoute("/dashboard/onboard")) redirect("/dashboard");

  const invitations = await getInvitations();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link
          href="/dashboard/onboardings"
          className="inline-flex min-h-10 items-center font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/55 hover:text-cobalt"
        >
          ← Onboarding queue
        </Link>
        <div className="mt-3">
          <WorkspaceHeader
            eyebrow="Operations / Client intake"
            title="Invite a client"
            description="Send a client a link to complete their own onboarding. When they submit, their case appears on the onboarding queue for approval; nothing is activated or routed to a partner before then."
          />
        </div>
      </div>

      <Section title="New invitation" subtitle="One working link per email address. Sending again retires the previous link.">
        <InviteClientForm />
      </Section>

      <Section title="Invitations" subtitle="The 50 most recent, newest first.">
        {invitations.length === 0 ? (
          <Empty>No invitations yet.</Empty>
        ) : (
          <ul className="-mx-5 -my-5 divide-y divide-ink/8 sm:-mx-6">
            {invitations.map((invitation) => (
              <InvitationItem key={invitation.id} invitation={invitation} />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
