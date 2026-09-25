"use client";

import { useActionState } from "react";
import { inviteClient, type InvitationState } from "@/features/onboarding/invitationActions";
import { InvitationResult } from "@/features/onboarding/InvitationResult";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";

export function InviteClientForm() {
  const [state, action, pending] = useActionState<InvitationState, FormData>(inviteClient, undefined);

  return (
    <div className="space-y-4">
      <form action={action} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label htmlFor="invite-email" className={labelStyles}>Client&apos;s email address</label>
          <input id="invite-email" name="email" type="email" required autoComplete="off" className={fieldStyles} />
        </div>
        <div>
          <label htmlFor="invite-business" className={labelStyles}>
            Business name <span className="font-normal text-ink/45">(optional, for your list)</span>
          </label>
          <input id="invite-business" name="businessName" maxLength={200} autoComplete="off" className={fieldStyles} />
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send invitation"}</Button>
      </form>
      <p className={helpTextStyles}>
        The client receives a link to fill in their business details, choose their package and set a password. Their
        account stays pending until someone approves it on the onboarding queue.
      </p>
      <InvitationResult state={state} />
    </div>
  );
}
