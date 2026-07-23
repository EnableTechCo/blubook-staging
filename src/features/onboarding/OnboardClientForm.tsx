"use client";

import Link from "next/link";
import { useActionState } from "react";
import { onboardClient, type OnboardState } from "@/features/onboarding/actions";

export interface PackageOption {
  id: string;
  name: string;
  tier: string;
  price: number;
}

const field =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500";
const label = "text-sm font-medium text-slate-700";

export function OnboardClientForm({ packages }: { packages: PackageOption[] }) {
  const [state, action, pending] = useActionState<OnboardState, FormData>(onboardClient, undefined);

  return (
    <form action={action} className="space-y-5">
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-900">Business</legend>
        <div>
          <label htmlFor="businessName" className={label}>
            Business name
          </label>
          <input id="businessName" name="businessName" type="text" required className={field} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-900">Primary contact & login</legend>
        <div>
          <label htmlFor="fullName" className={label}>
            Contact name
          </label>
          <input id="fullName" name="fullName" type="text" required className={field} />
        </div>
        <div>
          <label htmlFor="email" className={label}>
            Email
          </label>
          <input id="email" name="email" type="email" required className={field} />
        </div>
        <div>
          <label htmlFor="tempPassword" className={label}>
            Temporary password
          </label>
          <input id="tempPassword" name="tempPassword" type="text" required minLength={8} className={field} />
          <p className="mt-1 text-xs text-slate-500">
            At least 8 characters. Share this with the client so they can sign in.
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-900">Package</legend>
        <div>
          <label htmlFor="packageId" className={label}>
            Standard package
          </label>
          <select id="packageId" name="packageId" required defaultValue="" className={field}>
            <option value="" disabled>
              Select a package…
            </option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.tier} · R{Number(p.price).toLocaleString("en-ZA")}
              </option>
            ))}
          </select>
          {packages.length === 0 ? (
            <p className="mt-1 text-xs text-red-600">No active packages in the catalogue yet.</p>
          ) : null}
        </div>
      </fieldset>

      {state?.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || packages.length === 0}
          className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
        >
          {pending ? "Onboarding…" : "Create client & go live"}
        </button>
        <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
