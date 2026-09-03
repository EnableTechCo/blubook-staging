"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import {
  saveOpportunity,
  type OpportunityActionState,
} from "@/features/sales/actions";
import type {
  ForecastCategory,
  OpportunitySource,
  SalesOpportunity,
} from "@/features/sales/types";

export function OpportunityEditorDialog({
  sources,
  categories,
  opportunity,
}: {
  sources: OpportunitySource[];
  categories: ForecastCategory[];
  opportunity?: SalesOpportunity;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<OpportunityActionState, FormData>(
    saveOpportunity,
    undefined,
  );
  const titleId = useId();
  const saved = state !== undefined && "ok" in state;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (saved) dialogRef.current?.close();
  }, [saved]);

  return (
    <>
      <Button
        type="button"
        variant={opportunity ? "secondary" : "primary"}
        onClick={() => setOpen(true)}
      >
        {opportunity ? "Edit" : "Add opportunity"}
        {!opportunity ? <span aria-hidden="true">+</span> : null}
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current && !pending) setOpen(false);
        }}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        className="w-[min(48rem,calc(100vw-2rem))] border border-ink bg-paper-light p-0 text-ink backdrop:bg-ink/55"
      >
        {open ? (
          <form action={action} aria-busy={pending}>
            {opportunity ? (
              <>
                <input type="hidden" name="opportunityId" value={opportunity.id} />
                <input type="hidden" name="expectedUpdatedAt" value={opportunity.updated_at} />
              </>
            ) : null}
            <div className="flex items-start justify-between gap-5 border-b border-ink px-6 py-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-cobalt">
                  Sales pipeline
                </p>
                <h2 id={titleId} className="mt-1 font-heading text-[1.8rem] font-normal leading-none">
                  {opportunity ? "Edit opportunity" : "Add opportunity"}
                </h2>
                {opportunity ? (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/55">
                    {opportunity.deal_reference} · Deal ID cannot be changed
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                aria-label="Close opportunity editor"
                className="min-h-9 border border-ink/35 px-3 text-sm hover:bg-cream disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
              <OpportunityFields
                sources={sources}
                categories={categories}
                opportunity={opportunity}
              />
              {state && "error" in state ? (
                <p role="alert" className="mt-5 border-l-4 border-clay bg-clay/10 px-4 py-3 text-sm leading-6">
                  {state.error}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-4 border-t border-ink px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-sm text-ink/60 hover:text-ink disabled:opacity-50"
              >
                Cancel
              </button>
              <Button type="submit" disabled={pending || sources.length === 0 || categories.length === 0}>
                <span aria-live="polite">{pending ? "Saving…" : "Save opportunity"}</span>
              </Button>
            </div>
          </form>
        ) : null}
      </dialog>
    </>
  );
}

export function OpportunityFields({
  sources,
  categories,
  opportunity,
}: {
  sources: OpportunitySource[];
  categories: ForecastCategory[];
  opportunity?: SalesOpportunity;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="opportunitySource" className={labelStyles}>Opportunity source</label>
        <select
          id="opportunitySource"
          name="opportunitySource"
          defaultValue={opportunity?.opportunity_source ?? ""}
          required
          className={fieldStyles}
        >
          <option value="" disabled>Choose a source</option>
          {sources.map((source) => <option key={source.code} value={source.code}>{source.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="forecastCategory" className={labelStyles}>Forecast category</label>
        <select
          id="forecastCategory"
          name="forecastCategory"
          defaultValue={opportunity?.forecast_category ?? "open"}
          required
          className={fieldStyles}
        >
          {categories.map((category) => <option key={category.code} value={category.code}>{category.name}</option>)}
        </select>
        <p className={helpTextStyles}>Choosing Booked does not create a booking or sales order.</p>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="opportunityName" className={labelStyles}>Opportunity name</label>
        <input
          id="opportunityName"
          name="opportunityName"
          type="text"
          required
          maxLength={240}
          defaultValue={opportunity?.opportunity_name ?? ""}
          placeholder="e.g. Department of Education renewal"
          className={fieldStyles}
        />
      </div>
      <div>
        <label htmlFor="revenue" className={labelStyles}>Expected revenue (ZAR)</label>
        <input
          id="revenue"
          name="revenue"
          type="number"
          required
          min="0"
          max="999999999999.99"
          step="0.01"
          defaultValue={opportunity?.revenue ?? ""}
          className={fieldStyles}
        />
      </div>
      <div>
        <label htmlFor="expectedCloseDate" className={labelStyles}>Expected close date <span className="font-normal text-ink/45">(optional)</span></label>
        <input id="expectedCloseDate" name="expectedCloseDate" type="date" defaultValue={opportunity?.expected_close_date ?? ""} className={fieldStyles} />
        <p className={helpTextStyles}>The target date used to compare this opportunity with its actual booking date.</p>
      </div>
      <input type="hidden" name="fiscalYear" value={opportunity?.fiscal_year ?? ""} />
      <input type="hidden" name="fiscalQuarter" value={opportunity?.fiscal_quarter ?? ""} />
      <input type="hidden" name="fiscalWeek" value={opportunity?.fiscal_week ?? ""} />
    </div>
  );
}
