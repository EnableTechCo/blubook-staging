"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles } from "@/components/ui/formStyles";
import { updateBooking, type OpportunityActionState } from "@/features/sales/actions";
import type { SalesBooking } from "@/features/sales/types";

function BookingRow({ booking }: { booking: SalesBooking }) {
  const [state, action, pending] = useActionState<OpportunityActionState, FormData>(
    updateBooking,
    undefined,
  );
  const [year, setYear] = useState(booking.fiscal_year?.toString() ?? "");
  const [quarter, setQuarter] = useState(booking.fiscal_quarter?.toString() ?? "");

  return (
    <tr className="border-b border-ink/45 align-top last:border-b-0">
      <td className="whitespace-nowrap px-4 py-4">
        <p className="font-mono text-[11px] font-semibold text-cobalt">{booking.deal_reference}</p>
        <Link
          href={`/dashboard/reports/requests/${booking.salesOrder.id}`}
          className="mt-2 inline-block text-[10px] font-semibold text-ink/55 underline decoration-ink/35 underline-offset-4 hover:text-cobalt"
        >
          {booking.salesOrder.reference}
        </Link>
      </td>
      <th scope="row" className="min-w-56 px-4 py-4 text-sm font-semibold text-ink">
        {booking.opportunity_name}
      </th>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-ink/70">
        {booking.invoice_number ?? "—"}
      </td>
      <td className="min-w-44 px-4 py-3">
        <label className="sr-only" htmlFor={`revenue-${booking.id}`}>Revenue</label>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink/55">R</span>
          <input
            form={`booking-${booking.id}`}
            id={`revenue-${booking.id}`}
            name="revenue"
            type="number"
            min="0"
            max="999999999999.99"
            step="0.01"
            required
            defaultValue={booking.revenue}
            className={`${fieldStyles} min-h-10 py-2`}
          />
        </div>
      </td>
      <td className="min-w-40 px-4 py-3">
        <label className="sr-only" htmlFor={`payment-${booking.id}`}>Payment status</label>
        <select
          form={`booking-${booking.id}`}
          id={`payment-${booking.id}`}
          name="paymentStatus"
          defaultValue={booking.payment_status ?? "unpaid"}
          className={`${fieldStyles} min-h-10 py-2`}
        >
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
        </select>
        {booking.paid_at ? <p className="mt-1 text-[10px] text-teal">Payment recorded</p> : null}
      </td>
      <td className="min-w-72 px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          <label className="sr-only" htmlFor={`year-${booking.id}`}>Fiscal year</label>
          <input
            form={`booking-${booking.id}`}
            id={`year-${booking.id}`}
            name="fiscalYear"
            type="number"
            min="2000"
            max="2200"
            placeholder="FY"
            value={year}
            onChange={(event) => {
              setYear(event.target.value);
              if (!event.target.value) setQuarter("");
            }}
            className={`${fieldStyles} min-h-10 py-2`}
          />
          <label className="sr-only" htmlFor={`quarter-${booking.id}`}>Fiscal quarter</label>
          <select
            form={`booking-${booking.id}`}
            id={`quarter-${booking.id}`}
            name="fiscalQuarter"
            value={quarter}
            onChange={(event) => setQuarter(event.target.value)}
            disabled={!year}
            className={`${fieldStyles} min-h-10 py-2`}
          >
            <option value="">Q—</option>
            {[1, 2, 3, 4].map((value) => <option key={value} value={value}>Q{value}</option>)}
          </select>
          <label className="sr-only" htmlFor={`week-${booking.id}`}>Fiscal week</label>
          <select
            form={`booking-${booking.id}`}
            id={`week-${booking.id}`}
            name="fiscalWeek"
            defaultValue={booking.fiscal_week?.toString() ?? ""}
            disabled={!quarter}
            className={`${fieldStyles} min-h-10 py-2`}
          >
            <option value="">W—</option>
            {Array.from({ length: 13 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>W{value}</option>)}
          </select>
        </div>
      </td>
      <td className="min-w-36 px-4 py-3">
        <form id={`booking-${booking.id}`} action={action}>
          <input type="hidden" name="opportunityId" value={booking.id} />
          <input type="hidden" name="expectedUpdatedAt" value={booking.updated_at} />
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </form>
        {state && "error" in state ? (
          <p role="alert" className="mt-2 max-w-44 text-[10px] leading-4 text-clay">{state.error}</p>
        ) : state && "ok" in state ? (
          <p role="status" className="mt-2 text-[10px] text-teal">Saved</p>
        ) : null}
      </td>
    </tr>
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

  return (
    <div className="overflow-x-auto border border-ink bg-paper-light [scrollbar-gutter:stable]">
      <table className="w-full min-w-[78rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-ink bg-cream/60">
            {["Deal ID", "Opportunity", "Invoice number", "Revenue", "Paid / Unpaid", "Fiscal period", "Actions"].map((heading) => (
              <th key={heading} scope="col" className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/65">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{bookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)}</tbody>
      </table>
    </div>
  );
}
