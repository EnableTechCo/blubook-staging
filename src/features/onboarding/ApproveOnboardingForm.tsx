"use client";

import { useActionState } from "react";
import { approveOnboarding, type ApproveState } from "@/features/onboarding/actions";
import { Button } from "@/components/ui/Button";

/**
 * The one step that makes a client live. A confirmation is required because
 * approval is not undone from the application: it raises and routes the
 * client's requests to partners.
 */
export function ApproveOnboardingForm({ onboardingId, businessName }: { onboardingId: string; businessName: string }) {
  const [state, action, pending] = useActionState<ApproveState, FormData>(approveOnboarding, undefined);

  if (state && "ok" in state) {
    return (
      <div role="status" className="space-y-2">
        <p className="border-l-[3px] border-teal bg-teal/10 px-4 py-3 text-sm text-ink">
          <strong>{state.businessName}</strong> is live. Their requests are raised and routed, and the welcome pack and
          compliance request are on their way.
        </p>
        {state.warning ? (
          <p className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-sm text-ink">{state.warning}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="onboardingId" value={onboardingId} />
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
        <input type="checkbox" required className="mt-0.5 size-4 accent-cobalt" />
        <span>
          I have checked {businessName}&apos;s details. Approving activates their package and routes their requests to
          partners.
        </span>
      </label>
      {state && "error" in state ? (
        <p role="alert" className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-sm text-ink">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending}>{pending ? "Approving…" : "Approve and go live"}</Button>
    </form>
  );
}
