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
  service_groups: { name: string } | null;
}

const UNGROUPED = "Other services";

// Services are chosen through the work group that delivers them, so a client
// can see which team picks up the request before they raise it.
function byWorkGroup(services: ServiceOption[]): [string, ServiceOption[]][] {
  const groups = new Map<string, ServiceOption[]>();
  for (const service of services) {
    const name = service.service_groups?.name ?? UNGROUPED;
    groups.set(name, [...(groups.get(name) ?? []), service]);
  }

  // Ungrouped services match any capable partner, so they sit last.
  return [...groups.entries()].sort(([left], [right]) =>
    left === UNGROUPED ? 1 : right === UNGROUPED ? -1 : left.localeCompare(right),
  );
}

export function ServiceRequestForm({ services }: { services: ServiceOption[] }) {
  const [state, action, pending] = useActionState<TransactState, FormData>(
    submitServiceRequest,
    undefined,
  );

  return (
    <form action={action} aria-busy={pending} className="space-y-4">
      <div>
        <label htmlFor="serviceId" className={labelStyles}>
          Service
        </label>
        <select id="serviceId" name="serviceId" required defaultValue="" className={fieldStyles}>
          <option value="" disabled>
            Choose a service…
          </option>
          {byWorkGroup(services).map(([groupName, groupServices]) => (
            <optgroup key={groupName} label={groupName}>
              {groupServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                  {service.default_turnaround_days
                    ? ` — ${service.default_turnaround_days}-day turnaround`
                    : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className={helpTextStyles}>
          Services are grouped by the work group that delivers them. Your request goes to a
          matching partner in that group. BluBook stays in the middle — you are never identified
          to them.
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
          Details <span className="font-normal text-ink/45">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          placeholder="Anything the partner should know before starting."
          className="mt-1.5 w-full border border-ink/35 bg-cream p-3 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-rust focus:ring-[3px] focus:ring-rust/15"
        />
        <p className={helpTextStyles}>Please don&apos;t include contact details.</p>
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending || services.length === 0}>
          <span aria-live="polite">{pending ? "Submitting…" : "Submit request"}</span>
          {!pending ? <span aria-hidden="true">→</span> : null}
        </Button>
        <Link href="/dashboard/transact" className="text-sm text-ink/55 hover:text-rust">
          Cancel
        </Link>
      </div>
    </form>
  );
}
