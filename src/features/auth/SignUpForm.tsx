"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "@/features/auth/actions";

const field =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500";

export function SignUpForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
          Full name
        </label>
        <input id="fullName" name="fullName" type="text" autoComplete="name" required className={field} />
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={field} />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={field}
        />
        <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-sky-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
