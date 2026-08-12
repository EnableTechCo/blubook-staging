import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { SalesPipelineWorkspace } from "@/features/sales/SalesPipelineWorkspace";
import type { ForecastCategory, OpportunitySource, PipelineOpportunity } from "@/features/sales/types";

vi.mock("@/features/sales/actions", () => ({
  deleteOpportunity: vi.fn(),
  saveOpportunity: vi.fn(),
}));

// jsdom has no dialog implementation.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(cleanup);

const sources = [{ code: "referral", name: "Referral" }] as OpportunitySource[];
const categories = [{ code: "commit", name: "Commit" }] as ForecastCategory[];

const opportunity = (overrides: Partial<PipelineOpportunity> = {}): PipelineOpportunity =>
  ({
    id: "0f2c1d3e-4a5b-4c6d-8e9f-1a2b3c4d5e6f",
    deal_reference: "BLB-2026-000011",
    opportunity_name: "Riverside Cafe expansion retainer",
    opportunity_source: "referral",
    forecast_category: "commit",
    revenue: 480000,
    currency: "ZAR",
    fiscal_year: 2026,
    fiscal_quarter: 2,
    fiscal_week: 5,
    booked_at: null,
    updated_at: "2026-08-01T00:00:00Z",
    salesOrder: null,
    ...overrides,
  }) as PipelineOpportunity;

const withOrder = () =>
  opportunity({
    salesOrder: {
      id: "7d8e9f01-2a3b-4c5d-6e7f-8a9b0c1d2e3f",
      reference: "CLI-000031",
      status: "in_progress",
      title: "Sales order SO-2026-0042",
      description: "Twelve month bookkeeping retainer, invoiced monthly.",
      created_at: "2026-08-04T09:00:00Z",
    },
  });

describe("raising a sales order", () => {
  // One place to create a sales order: the Transact card. The pipeline used to
  // offer a second door into the same form, which is how two entry points end
  // up drifting apart.
  it("offers no way to raise a sales order", () => {
    render(
      <SalesPipelineWorkspace
        opportunities={[opportunity(), withOrder()]}
        sources={sources}
        categories={categories}
      />,
    );

    expect(screen.queryByText(/submit sales order/i)).not.toBeInTheDocument();
    expect(
      document.querySelector('a[href*="/dashboard/transact/sales-order"]'),
    ).toBeNull();
  });

  it("says where an opportunity has got to instead", () => {
    render(
      <SalesPipelineWorkspace
        opportunities={[opportunity()]}
        sources={sources}
        categories={categories}
      />,
    );
    expect(screen.getByText("No sales order yet — raise one from Transact.")).toBeInTheDocument();
  });
});

describe("viewing a sales order", () => {
  it("opens it in place rather than navigating away", async () => {
    render(
      <SalesPipelineWorkspace
        opportunities={[withOrder()]}
        sources={sources}
        categories={categories}
      />,
    );

    // The control is a button, not a link: nothing here navigates.
    const view = screen.getByRole("button", { name: "View sales order" });
    expect(view.tagName).toBe("BUTTON");

    expect(document.querySelector("dialog[open]")).toBeNull();

    await userEvent.click(view);

    const open = document.querySelector("dialog[open]");
    expect(open).not.toBeNull();
    expect(within(open as HTMLElement).getByRole("heading", { name: "CLI-000031" })).toBeInTheDocument();
  });

  it("shows the sales order's own detail once open", async () => {
    render(
      <SalesPipelineWorkspace
        opportunities={[withOrder()]}
        sources={sources}
        categories={categories}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "View sales order" }));

    const dialog = within(document.querySelector("dialog[open]") as HTMLElement);
    expect(dialog.getByRole("heading", { name: "CLI-000031" })).toBeInTheDocument();
    expect(dialog.getByText("Sales order SO-2026-0042")).toBeInTheDocument();
    expect(
      dialog.getByText("Twelve month bookkeeping retainer, invoiced monthly."),
    ).toBeInTheDocument();
    expect(dialog.getByText(/BLB-2026-000011/)).toBeInTheDocument();
  });

  // Messages, documents and assignment history have their own page. A dialog
  // that tried to be that page would be a worse version of it.
  it("still offers the full record for everything it does not show", async () => {
    render(
      <SalesPipelineWorkspace
        opportunities={[withOrder()]}
        sources={sources}
        categories={categories}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "View sales order" }));

    expect(screen.getByRole("link", { name: "Open full record" })).toHaveAttribute(
      "href",
      "/dashboard/reports/requests/7d8e9f01-2a3b-4c5d-6e7f-8a9b0c1d2e3f",
    );
  });

  it("closes again", async () => {
    render(
      <SalesPipelineWorkspace
        opportunities={[withOrder()]}
        sources={sources}
        categories={categories}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "View sales order" }));
    await userEvent.click(screen.getByRole("button", { name: "Close sales order" }));

    expect(document.querySelector("dialog[open]")).toBeNull();
  });
});
