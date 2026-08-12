"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { formatDate } from "@/features/dashboard/ui";
import type { PipelineOpportunity, PipelineSalesOrder } from "@/features/sales/types";

const zar = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.09em] text-ink/55">
        {label}
      </p>
      <div className="mt-1 text-sm leading-6 text-ink/85">{children}</div>
    </div>
  );
}

/**
 * The linked sales order, shown where it was asked for rather than by leaving
 * the pipeline for it. Checking what was submitted is a glance, and a glance
 * should not cost the page you were reading and a click back.
 *
 * Everything with its own life — messages, documents, the assignment history —
 * still lives on the request record, which this links to. A dialog that tried
 * to be that page would be a worse version of it.
 */
export function SalesOrderDialog({
  opportunity,
  salesOrder,
}: {
  opportunity: PipelineOpportunity;
  salesOrder: PipelineSalesOrder;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        View sales order
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
        className="w-[min(44rem,calc(100vw-2rem))] border border-ink bg-paper-light p-0 text-ink backdrop:bg-ink/55"
      >
        {open ? (
          <div>
            <div className="flex items-start justify-between gap-5 border-b border-ink px-6 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-cobalt">
                  Sales order
                </p>
                <h2
                  id={titleId}
                  className="mt-1 font-heading text-[1.8rem] font-normal leading-none"
                >
                  {salesOrder.reference}
                </h2>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/55">
                  {opportunity.deal_reference} · Raised {formatDate(salesOrder.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close sales order"
                className="min-h-9 shrink-0 border border-ink/35 px-3 text-sm hover:bg-cream"
              >
                ×
              </button>
            </div>

            <div className="max-h-[72vh] space-y-5 overflow-y-auto px-6 py-5">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <StatusLabel status={salesOrder.status} />
                <p className="font-heading text-2xl leading-none">
                  {zar.format(opportunity.revenue)}
                </p>
              </div>

              <Field label="Opportunity">{opportunity.opportunity_name}</Field>
              <Field label="Title">{salesOrder.title}</Field>
              <Field label="Details">
                {salesOrder.description ? (
                  <p className="whitespace-pre-wrap">{salesOrder.description}</p>
                ) : (
                  <span className="text-ink/50">No details were recorded.</span>
                )}
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-ink px-6 py-4">
              <Link
                href={`/dashboard/reports/requests/${salesOrder.id}`}
                className="inline-flex min-h-10 items-center border border-cobalt px-4 py-2 text-xs font-semibold text-cobalt hover:bg-cobalt hover:text-paper"
              >
                Open full record
              </Link>
              <Button type="button" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
