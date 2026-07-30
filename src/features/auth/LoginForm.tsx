"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { signIn, type AuthState } from "@/features/auth/actions";
import { PasswordField } from "@/features/auth/PasswordField";

export function LoginForm({ submitLabel = "Sign in" }: { submitLabel?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, undefined);

  return (
    <form
      action={action}
      aria-busy={pending}
      className="mt-3 space-y-2.5 border-t border-ink/20 pt-3"
    >
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
          className="border-l-[3px] border-cobalt bg-cream px-3 py-2 font-body text-xs leading-5 text-ink"
        >
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        fullWidth
        className="min-h-12 !border-ink !bg-ink !text-paper hover:!border-cobalt hover:!bg-cobalt"
      >
        <span aria-live="polite">{pending ? "Signing in…" : submitLabel}</span>
        {!pending ? <span aria-hidden="true">→</span> : null}
      </Button>

      <p className="border-l border-ink/25 pl-3 font-body text-[10px] leading-[0.9rem] text-ink/60">
        Signing in always opens the workspace assigned to your account. Need access?
        Contact your BluBook representative.
      </p>
    </form>
  );
}
