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
      className="mt-4 space-y-3 border-t border-[oklch(22%_0.012_60/0.2)] pt-4"
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
          className="border-l-[3px] border-[oklch(60.5%_0.128_40)] bg-[oklch(91.8%_0.022_82)] px-3 py-2 font-body text-xs leading-5 text-[oklch(22%_0.012_60)]"
        >
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        fullWidth
        className="min-h-12 !border-[oklch(22%_0.012_60)] !bg-[oklch(22%_0.012_60)] !text-[oklch(95.5%_0.014_85)] hover:!border-[oklch(60.5%_0.128_40)] hover:!bg-[oklch(60.5%_0.128_40)]"
      >
        <span aria-live="polite">{pending ? "Signing in…" : submitLabel}</span>
        {!pending ? <span aria-hidden="true">→</span> : null}
      </Button>

      <p className="border-l border-[oklch(22%_0.012_60/0.25)] pl-3 font-body text-[11px] leading-4 text-[oklch(22%_0.012_60/0.62)]">
        Signing in always opens the workspace assigned to your account. Need access?
        Contact your BluBook representative.
      </p>
    </form>
  );
}
