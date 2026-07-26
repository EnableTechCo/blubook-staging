"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
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
        <Button
          type="button"
          variant="quiet"
          aria-label={`${visible ? "Hide" : "Show"} password`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute bottom-0.5 right-1 min-h-11 px-3 font-mono text-[9px] uppercase tracking-[0.08em]"
        >
          {visible ? "Hide" : "Show"}
        </Button>
      </div>
      {helpText ? <p className={helpTextStyles}>{helpText}</p> : null}
    </div>
  );
}
