"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import { saveSalesTarget, type TargetActionState } from "@/features/sales/actions";
import type { SalesTargetsData } from "@/features/sales/types";
import { FISCAL_WEEKS_PER_QUARTER, SAST_LOCALE } from "@/lib/time";
import { evenWeeklyShare } from "@/lib/validation/salesTargets";

function sumOf(amounts: Map<number, number>): number {
  let total = 0;
  for (const amount of amounts.values()) total += amount;
  return total;
}

const money = new Intl.NumberFormat(SAST_LOCALE, {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

function WeekRow({
  fiscalYear,
  quarter,
  week,
  amount,
  calculated,
}: {
  fiscalYear: number;
  quarter: number;
  week: number;
  amount: number | null;
  calculated: number;
}) {
  const [state, action, pending] = useActionState<TargetActionState, FormData>(
    saveSalesTarget,
    undefined,
  );
  const failed = state !== undefined && "error" in state;

  return (
    <li className="flex flex-wrap items-end gap-3 border-b border-ink/12 px-4 py-3 last:border-b-0">
      <span className="w-16 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
        Week {week}
      </span>
      <form action={action} className="flex flex-1 flex-wrap items-end gap-3">
        <input type="hidden" name="fiscalYear" value={fiscalYear} />
        <input type="hidden" name="fiscalQuarter" value={quarter} />
        <input type="hidden" name="fiscalWeek" value={week} />
        <div className="min-w-36 flex-1">
          <label htmlFor={`week-${fiscalYear}-${quarter}-${week}`} className="sr-only">
            Week {week} target
          </label>
          <input
            id={`week-${fiscalYear}-${quarter}-${week}`}
            name="revenueTarget"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            defaultValue={amount ?? ""}
            placeholder={money.format(calculated)}
            className={fieldStyles}
          />
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
      <span className="w-40 text-right text-[11px] leading-5 text-ink/50">
        {failed ? (
          <span role="alert" className="text-clay">
            {state.error}
          </span>
        ) : amount === null ? (
          "Calculated for you"
        ) : (
          "Set by you"
        )}
      </span>
    </li>
  );
}

function QuarterRow({
  fiscalYear,
  quarter,
  target,
  weeks,
  isCurrent,
}: SalesTargetsData["quarters"][number] & { fiscalYear: number; isCurrent: boolean }) {
  const [state, action, pending] = useActionState<TargetActionState, FormData>(
    saveSalesTarget,
    undefined,
  );
  const failed = state !== undefined && "error" in state;

  const weekAmounts = new Map(weeks.map((row) => [row.fiscal_week as number, row.revenue_target]));
  const overriddenCount = weekAmounts.size;
  // What an unset week is worth today: the quarter less what is already
  // spoken for, spread across the weeks still being calculated.
  const remaining = Math.max((target?.revenue_target ?? 0) - sumOf(weekAmounts), 0);
  const unsetWeeks = FISCAL_WEEKS_PER_QUARTER - overriddenCount;
  const calculatedShare =
    unsetWeeks > 0
      ? remaining / unsetWeeks
      : evenWeeklyShare(target?.revenue_target ?? 0, FISCAL_WEEKS_PER_QUARTER);

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

      {/* Weekly detail is opt-in. The quarter alone already phases itself; this
          is for the client who knows one week is not like the others. */}
      <details className="sm:col-span-3">
        <summary className="cursor-pointer list-none py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt hover:text-cobalt-deep [&::-webkit-details-marker]:hidden">
          Weekly detail
          {overriddenCount > 0 ? ` · ${overriddenCount} set` : " · all calculated"}
        </summary>
        <ul className="border border-ink/20 bg-paper">
          {Array.from({ length: FISCAL_WEEKS_PER_QUARTER }, (_, index) => index + 1).map(
            (week) => (
              <WeekRow
                key={week}
                fiscalYear={fiscalYear}
                quarter={quarter}
                week={week}
                amount={weekAmounts.get(week) ?? null}
                calculated={calculatedShare}
              />
            ),
          )}
        </ul>
      </details>
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
