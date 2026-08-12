"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import { submitFinancials, type FinancialActionState } from "@/features/finance/actions";
import type { FinancialIntakeData } from "@/features/finance/queries";
import { FINANCIAL_FIELDS } from "@/lib/validation/financials";
import { FISCAL_QUARTERS, FISCAL_WEEKS_PER_QUARTER } from "@/lib/time";

export function FinancialIntakeForm({ data }: { data: FinancialIntakeData }) {
  const [state, action, pending] = useActionState<FinancialActionState, FormData>(
    submitFinancials,
    undefined,
  );
  const failed = state !== undefined && "error" in state;
  const saved = state !== undefined && "ok" in state;

  return (
    <form action={action} aria-busy={pending} className="space-y-8">
      {failed ? (
        <p role="alert" className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink">
          {state.error}
        </p>
      ) : null}
      {saved ? (
        <p className="border-l-[3px] border-teal bg-teal/10 px-4 py-3 text-[13px] leading-6 text-ink">
          Figures recorded for {state.reference}. Submitting the same week again will correct them.
        </p>
      ) : null}

      <div className="grid gap-5 border border-ink bg-paper p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor="clientId" className={labelStyles}>
            Customer
          </label>
          <select id="clientId" name="clientId" required defaultValue="" className={fieldStyles}>
            <option value="" disabled>
              Choose a customer…
            </option>
            {data.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.external_reference ?? "Customer"}
                {client.business_name ? ` · ${client.business_name}` : ""}
              </option>
            ))}
          </select>
          <p className={helpTextStyles}>
            Only the customers your practice is responsible for appear here.
          </p>
        </div>

        <div>
          <label htmlFor="fiscalYear" className={labelStyles}>
            Fiscal year
          </label>
          <input
            id="fiscalYear"
            name="fiscalYear"
            type="number"
            required
            defaultValue={data.fiscalYear}
            className={fieldStyles}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="fiscalQuarter" className={labelStyles}>
              Quarter
            </label>
            <select
              id="fiscalQuarter"
              name="fiscalQuarter"
              defaultValue={data.fiscalQuarter}
              className={fieldStyles}
            >
              {Array.from({ length: FISCAL_QUARTERS }, (_, index) => index + 1).map((quarter) => (
                <option key={quarter} value={quarter}>
                  Q{quarter}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fiscalWeek" className={labelStyles}>
              Week
            </label>
            <select
              id="fiscalWeek"
              name="fiscalWeek"
              defaultValue={data.fiscalWeek}
              className={fieldStyles}
            >
              {Array.from({ length: FISCAL_WEEKS_PER_QUARTER }, (_, index) => index + 1).map(
                (week) => (
                  <option key={week} value={week}>
                    {week}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Grouped by the ratio each set feeds, with the formula stated, so the
          partner can see what a figure is for rather than filling a blank. */}
      {FINANCIAL_FIELDS.map((group) => (
        <section key={group.group} className="border border-ink bg-paper">
          <div className="border-b border-ink px-5 py-4">
            <h2 className="font-heading text-[1.35rem] leading-none text-ink">{group.group}</h2>
            <p className="mt-2 text-xs leading-5 text-ink/55">{group.formula}</p>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {group.fields.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className={labelStyles}>
                  {field.label}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  step={"integer" in field && field.integer ? "1" : "0.01"}
                  inputMode="decimal"
                  placeholder="0"
                  className={fieldStyles}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending || data.clients.length === 0}>
          {pending ? "Recording…" : "Record figures"}
        </Button>
        <p className="text-xs leading-5 text-ink/55">
          A blank field is recorded as zero. Re-filing a week replaces it.
        </p>
      </div>
    </form>
  );
}
