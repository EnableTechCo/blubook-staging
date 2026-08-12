"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { sweepOverdueRequests, type OverdueSweepState } from "@/features/compliance/actions";

export function OverdueSweepButton() {
  const [state, action, pending] = useActionState<OverdueSweepState, FormData>(
    sweepOverdueRequests,
    undefined,
  );
  const failed = state !== undefined && "error" in state;
  const done = state !== undefined && "ok" in state;

  return (
    <form action={action} className="flex flex-wrap items-center gap-4">
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Checking…" : "Notify past-due requests"}
      </Button>
      <p className="text-xs leading-5 text-ink/55" role="status">
        {failed
          ? state.error
          : done
            ? state.raised === 0
              ? "Nothing past due that has not already been flagged."
              : `${state.raised} notification${state.raised === 1 ? "" : "s"} raised.`
            : "Safe to run as often as you like — a request is only flagged once."}
      </p>
    </form>
  );
}
