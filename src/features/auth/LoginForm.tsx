"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { signIn, type AuthState } from "@/features/auth/actions";
import { PasswordField } from "@/features/auth/PasswordField";

export function LoginForm({ submitLabel = "Sign in" }: { submitLabel?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, undefined);

  return (
    <form action={action} aria-busy={pending} className="mt-8 space-y-5">
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
      <PasswordField autoComplete="current-password" />

      {state?.error ? (
        <p
          role="alert"
          className="border-l-4 border-clay bg-clay/10 px-4 py-3 font-body text-sm leading-6 text-ink"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} fullWidth className="min-h-12">
        <span aria-live="polite">{pending ? "Signing in…" : submitLabel}</span>
        {!pending ? <span aria-hidden="true">→</span> : null}
      </Button>

      <p className="font-body text-xs leading-5 text-slate-600">
        Signing in always opens the workspace assigned to your account. Need access?
        Contact your BluBook representative.
      </p>
    </form>
  );
}
