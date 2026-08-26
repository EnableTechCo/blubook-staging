"use client";

import { useId, useState, type ReactNode } from "react";

export function RecordDisclosure({
  label,
  closeLabel = "Close",
  children,
}: {
  label: string;
  closeLabel?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="record-disclosure mt-3 border-t border-ink/12" data-open={open}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="record-disclosure__trigger flex min-h-11 w-full items-center justify-between gap-3 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.09em] text-cobalt"
      >
        <span>{open ? closeLabel : label}</span>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="record-disclosure__chevron size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      <div
        id={panelId}
        className="record-disclosure__panel"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="record-disclosure__clip">
          <div className="record-disclosure__content">{children}</div>
        </div>
      </div>
    </div>
  );
}
