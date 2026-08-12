"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Record,
  RecordHeader,
  RecordList,
  RecordMeta,
  RecordMetaList,
} from "@/components/ui/RecordList";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { money } from "@/features/dashboard/ui";
import { updateBooking, type OpportunityActionState } from "@/features/sales/actions";
import type { SalesBooking } from "@/features/sales/types";

// The fiscal position as one thing to read, because that is how it is spoken
// about — "Q3 week 4", not three numbers in three boxes.
function fiscalLabel(booking: SalesBooking): string {
  if (!booking.fiscal_year) return "Not phased yet";

  return [
    `FY${booking.fiscal_year}`,
    booking.fiscal_quarter ? `Q${booking.fiscal_quarter}` : null,
    booking.fiscal_week ? `Week ${booking.fiscal_week}` : null,
  ]
    .filter((part) => part !== null)
    .join(" · ");
}

function BookingRecord({ booking }: { booking: SalesBooking }) {
  const [state, action, pending] = useActionState<OpportunityActionState, FormData>(
    updateBooking,
    undefined,
  );
  const [year, setYear] = useState(booking.fiscal_year?.toString() ?? "");
  const [quarter, setQuarter] = useState(booking.fiscal_quarter?.toString() ?? "");
  const paid = booking.payment_status === "paid";

  return (
    <Record>
      {/* Everything worth knowing at a glance, and nothing that needs scrolling
          sideways to reach. The figure and whether it has been paid are the two
          things this page is opened for, so they lead. */}
      <RecordHeader>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-6 text-ink">{booking.opportunity_name}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-[11px] font-semibold text-cobalt">
              {booking.deal_reference}
            </span>
            <Link
              href={`/dashboard/reports/requests/${booking.salesOrder.id}`}
              className="font-mono text-[11px] text-ink/55 underline decoration-ink/35 underline-offset-4 hover:text-cobalt"
            >
              {booking.salesOrder.reference}
            </Link>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <p className="text-right">
            <span className="block font-heading text-2xl leading-none text-ink">
              {money(booking.revenue)}
            </span>
            {booking.paid_at ? (
              <span className="mt-1 block text-[10px] text-ink/55">Payment recorded</span>
            ) : null}
          </p>
          <StatusLabel status={paid ? "paid" : "unpaid"} />
        </div>
      </RecordHeader>

      <RecordMetaList>
        <RecordMeta label="Invoice number">{booking.invoice_number ?? "—"}</RecordMeta>
        <RecordMeta label="Fiscal period">
          {booking.fiscal_year ? (
            fiscalLabel(booking)
          ) : (
            <span className="text-ink/50">Not phased yet</span>
          )}
        </RecordMeta>
      </RecordMetaList>

      {/* Reading is the common case and editing is the occasional one, so the
          form is behind a disclosure rather than seven columns of live inputs.
          It also puts Save beside the fields it saves — in the table it was off
          the right edge, past a horizontal scroll, on any normal screen. */}
      <details className="group mt-3 border-t border-ink/12">
        <summary className="flex cursor-pointer list-none items-center gap-2 pt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.09em] text-cobalt [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Edit booking</span>
          <span className="hidden group-open:inline">Close</span>
        </summary>

        <form action={action} className="pb-1 pt-4">
          <input type="hidden" name="opportunityId" value={booking.id} />
          <input type="hidden" name="expectedUpdatedAt" value={booking.updated_at} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`revenue-${booking.id}`} className={labelStyles}>
                Revenue (ZAR)
              </label>
              <input
                id={`revenue-${booking.id}`}
                name="revenue"
                type="number"
                inputMode="decimal"
                min="0"
                max="999999999999.99"
                step="0.01"
                required
                defaultValue={booking.revenue}
                className={fieldStyles}
              />
            </div>

            <div>
              <label htmlFor={`payment-${booking.id}`} className={labelStyles}>
                Payment status
              </label>
              <select
                id={`payment-${booking.id}`}
                name="paymentStatus"
                defaultValue={booking.payment_status ?? "unpaid"}
                className={fieldStyles}
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <fieldset className="mt-4">
            <legend className={labelStyles}>Fiscal period</legend>
            <p className="mb-2 text-[11px] leading-5 text-ink/55">
              A quarter needs a year, and a week needs a quarter. Clearing the year clears both.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor={`year-${booking.id}`} className="sr-only">
                  Fiscal year
                </label>
                <input
                  id={`year-${booking.id}`}
                  name="fiscalYear"
                  type="number"
                  min="2000"
                  max="2200"
                  placeholder="Year"
                  value={year}
                  onChange={(event) => {
                    setYear(event.target.value);
                    if (!event.target.value) setQuarter("");
                  }}
                  className={fieldStyles}
                />
              </div>
              <div>
                <label htmlFor={`quarter-${booking.id}`} className="sr-only">
                  Fiscal quarter
                </label>
                <select
                  id={`quarter-${booking.id}`}
                  name="fiscalQuarter"
                  value={quarter}
                  onChange={(event) => setQuarter(event.target.value)}
                  disabled={!year}
                  className={fieldStyles}
                >
                  <option value="">Quarter</option>
                  {[1, 2, 3, 4].map((value) => (
                    <option key={value} value={value}>
                      Q{value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`week-${booking.id}`} className="sr-only">
                  Fiscal week
                </label>
                <select
                  id={`week-${booking.id}`}
                  name="fiscalWeek"
                  defaultValue={booking.fiscal_week?.toString() ?? ""}
                  disabled={!quarter}
                  className={fieldStyles}
                >
                  <option value="">Week</option>
                  {Array.from({ length: 13 }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>
                      Week {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            {state && "error" in state ? (
              <p role="alert" className="mr-auto text-[13px] leading-5 text-clay">
                {state.error}
              </p>
            ) : state && "ok" in state ? (
              <p role="status" className="mr-auto text-[13px] leading-5 text-teal">
                Saved.
              </p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save booking"}
            </Button>
          </div>
        </form>
      </details>
    </Record>
  );
}

export function SalesBookingsWorkspace({ bookings }: { bookings: SalesBooking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="border border-ink bg-paper-light px-6 py-10 text-center">
        <p className="font-heading text-2xl">No completed bookings yet</p>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink/60">
          An opportunity appears here after its linked sales order is completed with an invoice.
        </p>
      </div>
    );
  }

  const unpaid = bookings.filter((booking) => booking.payment_status !== "paid").length;

  return (
    <div className="space-y-3">
      <p className="text-[13px] leading-5 text-ink/60">
        {bookings.length} booking{bookings.length === 1 ? "" : "s"}
        {unpaid > 0 ? ` · ${unpaid} awaiting payment` : " · all paid"}
      </p>
      <RecordList>
        {bookings.map((booking) => (
          <BookingRecord key={booking.id} booking={booking} />
        ))}
      </RecordList>
    </div>
  );
}
