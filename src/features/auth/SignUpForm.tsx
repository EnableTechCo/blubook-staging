"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { signUp, type AuthState } from "@/features/auth/actions";
import { PasswordField } from "@/features/auth/PasswordField";

export function SignUpForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, undefined);

  return (
    <form action={action} aria-busy={pending} className="mt-8 space-y-5">
      <div>
        <label htmlFor="fullName" className={labelStyles}>
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          className={fieldStyles}
        />
      </div>
      <div>
        <label htmlFor="email" className={labelStyles}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldStyles}
        />
      </div>
      <PasswordField autoComplete="new-password" helpText="Use at least 8 characters." />

      {state?.error ? (
        <p
          role="alert"
          className="border-l-4 border-clay bg-clay/10 px-4 py-3 font-body text-sm leading-6 text-ink"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} fullWidth className="min-h-12">
        <span aria-live="polite">{pending ? "Creating account…" : "Create Client account"}</span>
        {!pending ? <span aria-hidden="true">→</span> : null}
      </Button>

      <p className="font-body text-xs leading-5 text-slate-600">
        Already approved?{" "}
        <Link
          href="/login"
          className="border-b border-ink font-semibold text-ink hover:border-cobalt hover:text-cobalt"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
