"use client";

import { useActionState } from "react";
import {
  resendInvitation,
  revokeInvitation,
  type InvitationState,
} from "@/features/onboarding/invitationActions";
import { InvitationResult } from "@/features/onboarding/InvitationResult";
import type { InvitationStatus } from "@/features/onboarding/invitations";

const actionButton =
  "min-h-9 rounded-md border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

/** Resend (a fresh link, the old one retired) and revoke, for one invitation. */
export function InvitationRowActions({
  invitationId,
  email,
  status,
}: {
  invitationId: string;
  email: string;
  status: InvitationStatus;
}) {
  const [state, action, pending] = useActionState<InvitationState, FormData>(resendInvitation, undefined);
  if (status === "accepted") return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-end gap-2">
        <form action={action}>
          <input type="hidden" name="invitationId" value={invitationId} />
          <button
            type="submit"
            disabled={pending || status === "in_use"}
            aria-label={`Send a new invitation link to ${email}`}
            className={`${actionButton} border-cobalt-deep/20 bg-white text-cobalt-deep hover:border-cobalt/40`}
          >
            {pending ? "Sending…" : "Send a new link"}
          </button>
        </form>
        {status === "open" ? (
          <form action={revokeInvitation}>
            <input type="hidden" name="invitationId" value={invitationId} />
            <button
              type="submit"
              aria-label={`Withdraw the invitation to ${email}`}
              className={`${actionButton} border-clay/35 bg-white text-clay hover:bg-clay hover:text-paper`}
            >
              Withdraw
            </button>
          </form>
        ) : null}
      </div>
      <InvitationResult state={state} />
    </div>
  );
}
