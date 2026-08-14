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
          className="absolute bottom-1.5 right-1.5 top-3 min-h-9 rounded-lg border border-ink/10 bg-paper-light px-4 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-ink/60 shadow-sm transition-colors hover:border-cobalt/20 hover:bg-cobalt-wash hover:text-cobalt"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {helpText ? <p className={helpTextStyles}>{helpText}</p> : null}
    </div>
  );
}
