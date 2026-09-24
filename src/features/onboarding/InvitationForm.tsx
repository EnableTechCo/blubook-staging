"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { sendOnboardingInvitation, type InvitationState } from "@/features/onboarding/invitationActions";

export function InvitationForm() {
  const [state, action, pending] = useActionState<InvitationState, FormData>(sendOnboardingInvitation, undefined);
  return (
    <section className="workspace-panel p-5" aria-labelledby="invite-customer-title">
      <h2 id="invite-customer-title" className="text-lg font-semibold">Invite a customer</h2>
      <p className="mt-1 text-sm text-ink/60">Send a secure, single-use link to BluBook’s existing onboarding form.</p>
      <form action={action} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="customer-invite-email" className={labelStyles}>Customer email</label>
          <input id="customer-invite-email" name="email" type="email" required maxLength={254} autoComplete="email" className={fieldStyles} />
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send invitation"}</Button>
      </form>
      {state?.message ? <p role="status" className="mt-3 text-sm text-teal">{state.message}</p> : null}
      {state?.error ? <p role="alert" className="mt-3 text-sm text-clay">{state.error}</p> : null}
    </section>
  );
}
