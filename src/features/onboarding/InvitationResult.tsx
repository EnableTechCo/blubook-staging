"use client";

import { useState } from "react";
import type { InvitationState } from "@/features/onboarding/invitationActions";
import { fieldStyles } from "@/components/ui/formStyles";

/**
 * What happened to an invitation just issued. When the email went, a line
 * saying so. When it did not, the link itself: it exists nowhere else, so this
 * is the one moment staff can pass it on.
 */
export function InvitationResult({ state }: { state: InvitationState }) {
  const [copied, setCopied] = useState(false);
  if (!state) return null;

  if ("error" in state) {
    return (
      <p role="alert" className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-sm text-ink">
        {state.error}
      </p>
    );
  }

  if (state.delivery === "sent") {
    return (
      <p role="status" className="border-l-[3px] border-teal bg-teal/10 px-4 py-3 text-sm text-ink">
        Invitation emailed to <strong>{state.email}</strong>. The link works once and expires in 7 days.
      </p>
    );
  }

  return (
    <div role="status" className="space-y-3 border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-sm text-ink">
      <p>
        The invitation for <strong>{state.email}</strong> was created, but the email was not sent: {state.reason}.
        Send the client this link yourself. It will not be shown again.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="invitation-link" className="sr-only">Invitation link</label>
        <input
          id="invitation-link"
          readOnly
          value={state.link}
          onFocus={(event) => event.currentTarget.select()}
          className={`${fieldStyles} mt-0 min-w-0 flex-1 font-mono text-xs`}
        />
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(state.link);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
          className="min-h-11 rounded-md border border-cobalt-deep/20 bg-white px-4 text-xs font-semibold text-cobalt-deep hover:border-cobalt/40"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="text-xs text-ink/65">Share it only with the client. Anyone with the link can complete this onboarding.</p>
    </div>
  );
}
