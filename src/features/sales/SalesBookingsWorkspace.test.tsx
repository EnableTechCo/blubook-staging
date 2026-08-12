import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SalesBookingsWorkspace } from "@/features/sales/SalesBookingsWorkspace";
import type { SalesBooking } from "@/features/sales/types";

vi.mock("@/features/sales/actions", () => ({ updateBooking: vi.fn() }));

const booking = (overrides: Partial<SalesBooking> = {}): SalesBooking => ({
  id: "3f1a6d2e-1c4b-4a9e-9c3d-0b7a5e2f8c41",
  deal_reference: "BLB-2026-000004",
  opportunity_name: "QA C3 20260811 Pipeline Opportunity",
  invoice_number: "QA-C3-INV-20260811",
  revenue: 125000,
  currency: "ZAR",
  payment_status: "paid",
  paid_at: "2026-08-11T10:00:00Z",
  fiscal_year: 2026,
  fiscal_quarter: 3,
  fiscal_week: null,
  booked_at: "2026-08-11T10:00:00Z",
  updated_at: "2026-08-11T10:00:00Z",
  salesOrder: {
    id: "9c2b0f5a-77d4-4f21-8f0e-2a6d1b3c4e50",
    reference: "CLI-000023",
    status: "completed",
  },
  ...overrides,
});

afterEach(cleanup);

describe("bookings", () => {
  it("shows every field the old table showed, without an editor open", () => {
    render(<SalesBookingsWorkspace bookings={[booking()]} />);

    expect(screen.getByText("QA C3 20260811 Pipeline Opportunity")).toBeInTheDocument();
    expect(screen.getByText("BLB-2026-000004")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CLI-000023" })).toHaveAttribute(
      "href",
      "/dashboard/reports/requests/9c2b0f5a-77d4-4f21-8f0e-2a6d1b3c4e50",
    );
    expect(screen.getByText("QA-C3-INV-20260811")).toBeInTheDocument();
    expect(screen.getByText("FY2026 · Q3")).toBeInTheDocument();
  });

  // The figure was a raw 125000 in a spinner box. It is what the page is opened
  // for, so it is now formatted and reads as money.
  it("formats revenue as currency rather than a bare number", () => {
    render(<SalesBookingsWorkspace bookings={[booking()]} />);

    const heading = screen.getByRole("heading", { level: 3 });
    const record = heading.closest("article");
    expect(record).not.toBeNull();
    // Non-breaking spaces: en-ZA groups thousands with U+00A0.
    expect(record!.textContent).toMatch(/R[\s ]?125[\s ]?000/);
  });

  it("states the payment position without needing the editor", () => {
    render(<SalesBookingsWorkspace bookings={[booking()]} />);
    expect(screen.getByText("Paid", { selector: "span" })).toBeInTheDocument();
    cleanup();

    render(
      <SalesBookingsWorkspace bookings={[booking({ payment_status: "unpaid", paid_at: null })]} />,
    );
    expect(screen.getByText("Unpaid", { selector: "span" })).toBeInTheDocument();
  });

  it("says so plainly when a booking has no fiscal period", () => {
    render(
      <SalesBookingsWorkspace
        bookings={[booking({ fiscal_year: null, fiscal_quarter: null, fiscal_week: null })]}
      />,
    );
    expect(screen.getByText("Not phased yet")).toBeInTheDocument();
  });

  // The defect in the screenshot: the table's min-width pushed Save past the
  // right edge behind a horizontal scroll, so a row could be edited and never
  // submitted. Save now sits in the same form as the fields.
  it("keeps the save control in the document with the fields it saves", () => {
    render(<SalesBookingsWorkspace bookings={[booking()]} />);

    const save = screen.getByRole("button", { name: "Save booking" });
    const form = save.closest("form");
    expect(form).not.toBeNull();
    expect(within(form!).getByLabelText("Revenue (ZAR)")).toBeInTheDocument();
    expect(within(form!).getByLabelText("Payment status")).toBeInTheDocument();
    expect(within(form!).getByLabelText("Fiscal year")).toBeInTheDocument();
  });

  it("summarises how many bookings are still awaiting payment", () => {
    render(
      <SalesBookingsWorkspace
        bookings={[booking(), booking({ id: "b", payment_status: "unpaid", paid_at: null })]}
      />,
    );
    expect(screen.getByText("2 bookings · 1 awaiting payment")).toBeInTheDocument();
  });

  it("still explains itself when there is nothing to show", () => {
    render(<SalesBookingsWorkspace bookings={[]} />);
    expect(screen.getByText("No completed bookings yet")).toBeInTheDocument();
  });
});
