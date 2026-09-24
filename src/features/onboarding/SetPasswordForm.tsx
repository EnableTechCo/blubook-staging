"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { createClient } from "@/lib/supabase/client";

export function SetPasswordForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmPassword") ?? "");
    if (password.length < 12) {
      setError("Use at least 12 characters for your password.");
      setBusy(false);
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      setBusy(false);
      return;
    }

    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) {
      setError("We could not set your password. Request a fresh setup link and try again.");
      setBusy(false);
      return;
    }
    router.replace("/dashboard?accountCreated=1");
    router.refresh();
  }

  return (
    <form action={submit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="new-password" className={labelStyles}>New password</label>
        <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={12} required className={fieldStyles} />
      </div>
      <div>
        <label htmlFor="confirm-password" className={labelStyles}>Confirm password</label>
        <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required className={fieldStyles} />
      </div>
      {error ? <p role="alert" className="text-sm text-clay">{error}</p> : null}
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Continue to dashboard"}</Button>
    </form>
  );
}
