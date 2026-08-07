"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import {
  setProviderPaymentStatus,
  type PaymentActionState,
} from "@/features/requests/paymentActions";

export function ProviderPaymentControl({
  requestId,
  paymentStatus,
  expectedUpdatedAt,
}: {
  requestId: string;
  paymentStatus: "paid" | "unpaid" | null;
  expectedUpdatedAt: string;
}) {
  const [state, action, pending] = useActionState<PaymentActionState, FormData>(
    setProviderPaymentStatus,
    undefined,
  );
  return (
    <form action={action} className="mt-6 border border-ink bg-paper-light p-5">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt} />
      <p className="font-heading text-2xl">Payment status</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink/65">
        Record whether the client has paid this invoice. Paid closes the opportunity; reverting to Unpaid preserves its Closed category for audit continuity.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-44">
          <label htmlFor={`provider-payment-${requestId}`} className={labelStyles}>Current state</label>
          <select
            id={`provider-payment-${requestId}`}
            name="paymentStatus"
            defaultValue={paymentStatus ?? "unpaid"}
            className={`${fieldStyles} min-h-10 py-2`}
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Updating…" : "Update payment"}</Button>
      </div>
      {state && "error" in state ? <p role="alert" className="mt-3 text-sm text-clay">{state.error}</p> : null}
      {state && "ok" in state ? <p role="status" className="mt-3 text-sm text-teal">Payment status updated.</p> : null}
    </form>
  );
}
