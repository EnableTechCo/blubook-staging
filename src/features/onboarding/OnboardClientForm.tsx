"use client";

import Link from "next/link";
import { useActionState } from "react";
import { onboardClient, type OnboardState } from "@/features/onboarding/actions";
import {
  PackageBuilder,
  type BuilderLineItem,
  type BuilderPackage,
} from "@/features/onboarding/PackageBuilder";
import { Button, buttonStyles } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";

function Step({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="grid gap-5 border-t border-ink/35 py-7 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <legend className="sr-only">{title}</legend>
      <div>
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-cobalt">
          Step {number}
        </span>
        <h2 className="mt-2 font-heading text-2xl">{title}</h2>
        <p className="mt-2 text-xs leading-5 text-ink/55">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

export function OnboardClientForm({
  packages,
  lineItems,
}: {
  packages: BuilderPackage[];
  lineItems: BuilderLineItem[];
}) {
  const [state, action, pending] = useActionState<OnboardState, FormData>(onboardClient, undefined);

  return (
    <form action={action} aria-busy={pending}>
      <Step number="01" title="Business" description="Identify the organisation joining the network.">
        <div>
          <label htmlFor="businessName" className={labelStyles}>
            Business name
          </label>
          <input id="businessName" name="businessName" type="text" required className={fieldStyles} />
        </div>
      </Step>

      <Step
        number="02"
        title="Primary contact"
        description="Create the named contact and their initial account credentials."
      >
        <div>
          <label htmlFor="fullName" className={labelStyles}>
            Contact name
          </label>
          <input id="fullName" name="fullName" type="text" required className={fieldStyles} />
        </div>
        <div>
          <label htmlFor="email" className={labelStyles}>
            Email
          </label>
          <input id="email" name="email" type="email" required className={fieldStyles} />
        </div>
        <div>
          <label htmlFor="tempPassword" className={labelStyles}>
            Temporary password
          </label>
          <input
            id="tempPassword"
            name="tempPassword"
            type="text"
            required
            minLength={8}
            className={fieldStyles}
            aria-describedby="password-help"
          />
          <p id="password-help" className={helpTextStyles}>
            Use at least 8 characters. Share this securely so the client can sign in.
          </p>
        </div>
      </Step>

      <Step
        number="03"
        title="Service package"
        description="Start with a catalogue package, then tailor it if the client needs more."
      >
        <PackageBuilder packages={packages} lineItems={lineItems} />
        {packages.length === 0 ? (
          <p role="alert" className="border-l-2 border-clay bg-clay/10 px-4 py-3 text-sm text-clay">
            No active packages are available in the catalogue.
          </p>
        ) : null}
      </Step>

      {state?.error ? (
        <p role="alert" className="mb-5 border border-clay bg-clay/10 px-4 py-3 text-sm text-clay">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-ink py-6 sm:flex-row sm:items-center sm:justify-end">
        <Link href="/dashboard" className={buttonStyles({ variant: "quiet" })}>
          Cancel
        </Link>
        <Button type="submit" disabled={pending || packages.length === 0}>
          {pending ? "Onboarding…" : "Create client & go live"}
        </Button>
      </div>
    </form>
  );
}
