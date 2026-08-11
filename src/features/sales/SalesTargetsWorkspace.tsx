"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import { saveSalesTarget, type TargetActionState } from "@/features/sales/actions";
import type { SalesTargetsData } from "@/features/sales/types";
import { SAST_LOCALE } from "@/lib/time";

const money = new Intl.NumberFormat(SAST_LOCALE, {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

function QuarterRow({
  fiscalYear,
  quarter,
  target,
  isCurrent,
}: SalesTargetsData["quarters"][number] & { fiscalYear: number; isCurrent: boolean }) {
  const [state, action, pending] = useActionState<TargetActionState, FormData>(
    saveSalesTarget,
    undefined,
  );
  const failed = state !== undefined && "error" in state;

  return (
    <li
      className={`grid gap-4 border-b border-r border-ink p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-end ${
        isCurrent ? "bg-cream/45" : "bg-paper"
      }`}
    >
      <div className="sm:w-28">
        <p className="font-heading text-[1.4rem] leading-none text-ink">Q{quarter}</p>
        <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-ink/50">
          {isCurrent ? "Current quarter" : `FY${fiscalYear}`}
        </p>
      </div>

      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="fiscalYear" value={fiscalYear} />
        <input type="hidden" name="fiscalQuarter" value={quarter} />
        <div className="min-w-40 flex-1">
          <label htmlFor={`target-${fiscalYear}-${quarter}`} className={labelStyles}>
            Revenue target
          </label>
          <input
            id={`target-${fiscalYear}-${quarter}`}
            name="revenueTarget"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            defaultValue={target ? target.revenue_target : ""}
            placeholder="No target set"
            className={fieldStyles}
            aria-describedby={`target-help-${fiscalYear}-${quarter}`}
          />
          <p id={`target-help-${fiscalYear}-${quarter}`} className={helpTextStyles}>
            {target
              ? `${money.format(target.revenue_target)} across thirteen weeks — ${money.format(target.revenue_target / 13)} a week.`
              : "Leave empty for no target. Clearing a set target removes it."}
          </p>
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>

      <div className="sm:w-40 sm:text-right">
        {failed ? (
          <p role="alert" className="text-[12px] leading-5 text-clay">
            {state.error}
          </p>
        ) : (
          <p className="font-heading text-[1.4rem] leading-none text-ink">
            {target ? money.format(target.revenue_target) : "—"}
          </p>
        )}
      </div>
    </li>
  );
}

export function SalesTargetsWorkspace({ data }: { data: SalesTargetsData }) {
  return (
    <ul className="grid border-l border-t border-ink">
      {data.quarters.map((entry) => (
        <QuarterRow
          key={entry.quarter}
          {...entry}
          fiscalYear={data.fiscalYear}
          isCurrent={data.isCurrentYear && entry.quarter === data.currentQuarter}
        />
      ))}
    </ul>
  );
}
