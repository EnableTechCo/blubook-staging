"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import { submitServiceRequest, type TransactState } from "@/features/transact/actions";

export interface ServiceOption {
  id: string;
  name: string;
  description: string | null;
  default_turnaround_days: number | null;
}

export function ServiceRequestForm({ services }: { services: ServiceOption[] }) {
  const [state, action, pending] = useActionState<TransactState, FormData>(
    submitServiceRequest,
    undefined,
  );

  return (
    <form action={action} aria-busy={pending} className="space-y-5">
      <div>
        <label htmlFor="serviceId" className={labelStyles}>
          Service
        </label>
        <select id="serviceId" name="serviceId" required defaultValue="" className={fieldStyles}>
          <option value="" disabled>
            Choose a service…
          </option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
              {service.default_turnaround_days
                ? ` — ${service.default_turnaround_days}-day turnaround`
                : ""}
            </option>
          ))}
        </select>
        <p className={helpTextStyles}>
          Your request is sent to a matching Service Partner. BluBook stays in the middle — you
          are never identified to them.
        </p>
      </div>

      <div>
        <label htmlFor="title" className={labelStyles}>
          What do you need?
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          placeholder="e.g. VAT submission for March"
          className={fieldStyles}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelStyles}>
          Details <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          placeholder="Anything the partner should know before starting."
          className="mt-2 w-full border border-ink/35 bg-paper-light p-3 font-body text-sm text-ink outline-none placeholder:text-slate-400 focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
        />
        <p className={helpTextStyles}>Please don&apos;t include contact details.</p>
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="border-l-4 border-clay bg-clay/10 px-4 py-3 font-body text-sm leading-6 text-ink"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending || services.length === 0}>
          <span aria-live="polite">{pending ? "Submitting…" : "Submit request"}</span>
          {!pending ? <span aria-hidden="true">→</span> : null}
        </Button>
        <Link href="/dashboard/transact" className="font-body text-sm text-slate-600 hover:text-cobalt">
          Cancel
        </Link>
      </div>
    </form>
  );
}
