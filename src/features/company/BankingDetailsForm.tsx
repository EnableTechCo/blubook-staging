"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import { saveBankingDetails, type BankingState } from "@/features/company/actions";
import type { BankingDetails } from "@/features/company/queries";

function Field({
  name, label, value, required = true, help,
}: {
  name: string; label: string; value?: string | null; required?: boolean; help?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelStyles}>
        {label} {required ? null : <span className="font-normal text-ink/45">(optional)</span>}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        defaultValue={value ?? ""}
        className={fieldStyles}
        aria-describedby={help ? `${name}-help` : undefined}
      />
      {help ? <p id={`${name}-help`} className={helpTextStyles}>{help}</p> : null}
    </div>
  );
}

export function BankingDetailsForm({ details }: { details: BankingDetails | null }) {
  const [state, action, pending] = useActionState<BankingState, FormData>(
    saveBankingDetails,
    undefined,
  );

  return (
    <form action={action} className="border border-ink bg-paper-light px-5 py-5">
      <h2 className="font-heading text-2xl leading-none">Banking details</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
        Stored for you alone: no BluBook staff member and no partner can read what you type here,
        which is why you enter it rather than giving it to us at onboarding. The quotations you
        raise are filed the same way — BluBook staff can read the rest of your archive, but not
        those. You can still leave banking off your letterhead below if you would rather it did not
        appear on what you send.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field name="bankName" label="Bank" value={details?.bank_name} />
        <Field name="accountName" label="Account name" value={details?.account_name} />
        <Field name="accountNumber" label="Account number" value={details?.account_number} />
        <Field name="branchCode" label="Branch code" value={details?.branch_code} />
        <Field name="accountType" label="Account type" value={details?.account_type} required={false} help="Cheque, savings, current." />
        <Field name="swiftCode" label="SWIFT code" value={details?.swift_code} required={false} help="Only needed if you invoice outside South Africa." />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-ink/30 pt-5">
        {state && "error" in state ? (
          <p role="alert" className="mr-auto text-[13px] leading-5 text-clay">{state.error}</p>
        ) : state && "ok" in state ? (
          <p role="status" className="mr-auto text-[13px] leading-5 text-teal">Saved.</p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : details ? "Update banking details" : "Save banking details"}
        </Button>
      </div>
    </form>
  );
}
