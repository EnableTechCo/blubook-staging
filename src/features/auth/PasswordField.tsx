"use client";

import { useState } from "react";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";

export function PasswordField({
  autoComplete,
  helpText,
}: {
  autoComplete: "current-password" | "new-password";
  helpText?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor="password" className={labelStyles}>
        Password
      </label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={8}
          className={`${fieldStyles} pr-24`}
        />
        <button
          type="button"
          aria-label={`${visible ? "Hide" : "Show"} password`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-2 right-0 min-h-10 border-l border-ink/25 px-4 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-ink/65 transition-colors hover:bg-paper hover:text-cobalt"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {helpText ? <p className={helpTextStyles}>{helpText}</p> : null}
    </div>
  );
}
