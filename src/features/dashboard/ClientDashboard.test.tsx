import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ClientDashboard } from "@/features/dashboard/ClientDashboard";
import type { ClientDashboardData } from "@/services/dashboard";
import type { SalesPerformanceData } from "@/features/sales/types";
import type { ClientFinanceData } from "@/features/finance/queries";

afterEach(cleanup);

const data: ClientDashboardData = {
  client: {
    id: "client-1",
    business_name: "Maboneng Trading",
    status: "active",
    artwork_path: null,
  },
  packages: [
    {
      id: "package-1",
      name: "Operations support",
      type: "standard",
      tier: "intermediate",
      total_price: 2450,
      status: "active",
      client_package_line_items: [
        {
          name: "Monthly administration",
          tier: "intermediate",
          unit_price: 2450,
          quantity: 1,
        },
      ],
    },
  ],
  requests: [
    {
      id: "request-1",
      reference: "REQ-1042",
      title: "Monthly filing",
      status: "in_progress",
      origin: "system",
      created_at: "2026-07-01T00:00:00.000Z",
      client_id: "client-1",
      provider_id: "provider-1",
      services: { name: "Administration" },
      providers: null,
      clients: null,
      request_schedules: {
        due_at: "2026-07-31T00:00:00.000Z",
        eta_type: "static",
      },
    },
  ],
};

const performance: SalesPerformanceData = {
  fiscalYear: 2026,
  fiscalQuarter: 2,
  throughWeek: 11,
  isCurrentQuarter: true,
  opportunities: [
    {
      revenue: 635_000,
      forecast_category: "booked",
      fiscal_year: 2026,
      fiscal_quarter: 2,
      fiscal_week: 3,
    },
    {
      revenue: 180_000,
      forecast_category: "commit",
      fiscal_year: 2026,
      fiscal_quarter: 2,
      fiscal_week: 11,
    },
  ],
  target: 780_000,
  categories: [
    { code: "commit", name: "Commit", description: "Highly confident deal.", display_order: 40 },
    { code: "open", name: "Open", description: null, display_order: 10 },
  ],
  error: null,
};

const financials: ClientFinanceData = {
  fiscalYear: 2026,
  fiscalQuarter: 2,
  weeks: [
    {
      fiscal_week: 11,
      net_income: 100_000,
      non_cash_expenses: 20_000,
      working_capital_change: -5_000,
      earnings: 200_000,
      taxes: 30_000,
      depreciation: 10_000,
      amortisation: 5_000,
      current_assets: 500_000,
      current_liabilities: 250_000,
      total_liabilities: 400_000,
      total_equity: 800_000,
      lost_customers: 2,
      total_customers: 40,
    },
  ],
  error: null,
};

const noFinancials: ClientFinanceData = { ...financials, weeks: [] };

const emptyPerformance: SalesPerformanceData = {
  ...performance,
  opportunities: [],
  target: null,
};

describe("ClientDashboard", () => {
  it("leads on the two dash cards without exposing provider identity", () => {
    render(<ClientDashboard data={data} performance={performance} financials={financials} />);

    expect(screen.getByRole("heading", { level: 1, name: "Maboneng Trading" })).toBeInTheDocument();
    expect(screen.getByText("Sales Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Operations Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("provider-1")).not.toBeInTheDocument();
  });

  // Request-level detail — pipeline by status, demand by service, SLA — moved
  // to Reports, so the landing page no longer carries it.
  it("leaves the request breakdown to the Reports performance view", () => {
    render(<ClientDashboard data={data} performance={performance} financials={financials} />);
    expect(screen.queryByText("Current pipeline")).not.toBeInTheDocument();
    expect(screen.queryByText("Requests by service")).not.toBeInTheDocument();
    expect(screen.queryByText("Active workload")).not.toBeInTheDocument();
  });

  // The package moved off this view; its requests are what the client sees.
  it("no longer lists the package itself", () => {
    render(<ClientDashboard data={data} performance={performance} financials={financials} />);
    expect(screen.queryByText("Operations support")).not.toBeInTheDocument();
    expect(screen.queryByText("Monthly administration")).not.toBeInTheDocument();
  });

  it("keeps empty account states explicit", () => {
    render(
      <ClientDashboard
        data={{ client: null, packages: [], requests: [] }}
        performance={emptyPerformance}
        financials={noFinancials}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Your business" })).toBeInTheDocument();
    // An account with no work still gets both cards, reading zero rather than
    // vanishing — an empty dashboard should say it is empty.
    const operations = screen.getByText("Operations Dashboard").closest("section")!;
    expect(within(operations).getByText("0")).toBeInTheDocument();
    expect(within(operations).getByText("Total open SR")).toBeInTheDocument();
  });
});

// The brief's Dash Landing Page leads on sales, above delivery performance.
describe("ClientDashboard sales dash", () => {
  it("leads with the quarter's delivered revenue and its target", () => {
    render(<ClientDashboard data={data} performance={performance} financials={financials} />);

    // Terms appear twice on this page — once as a tile, once in the legend —
    // so the card is queried on its own rather than across the whole document.
    const card = screen.getByText("Sales Dashboard").closest("section")!;
    expect(within(card).getByText("Q2 · week 11 of 13")).toBeInTheDocument();
    expect(within(card).getByText("QTD sales phasing")).toBeInTheDocument();
    expect(within(card).getByText("Week 11 commit")).toBeInTheDocument();
  });

  it("says the target is unset rather than showing a misleading zero", () => {
    render(<ClientDashboard data={data} performance={emptyPerformance} financials={financials} />);
    expect(
      screen.getByText(/Set a target to measure it against/),
    ).toBeInTheDocument();
  });
});

// Every figure on the dashboard is explained, including the ones this codebase
// computes rather than stores.
describe("ClientDashboard metric legend", () => {
  const legend = () =>
    screen.getByText("Legend — what these figures mean").closest("details")!;

  it("defines the computed metrics", () => {
    render(<ClientDashboard data={data} performance={performance} financials={financials} />);
    expect(within(legend()).getByText("QTD sales phasing")).toBeInTheDocument();
    expect(within(legend()).getByText("Slipped")).toBeInTheDocument();
  });

  it("takes forecast definitions from the database rather than repeating them", () => {
    render(<ClientDashboard data={data} performance={performance} financials={financials} />);
    expect(within(legend()).getByText("Highly confident deal.")).toBeInTheDocument();
  });

  it("admits a category with no definition instead of dropping it", () => {
    render(<ClientDashboard data={data} performance={performance} financials={financials} />);
    expect(within(legend()).getByText("Open")).toBeInTheDocument();
    expect(within(legend()).getByText("No definition recorded yet.")).toBeInTheDocument();
  });
});

// The Operations Dashboard reads how work is moving, not what it is worth. Its metrics
// are computed here rather than stored, and several are still awaiting names.
describe("ClientDashboard ops dashboard", () => {
  it("renders alongside the sales dashboard rather than replacing it", () => {
    render(<ClientDashboard data={data} performance={performance} financials={financials} />);
    expect(screen.getByText("Operations Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Sales Dashboard")).toBeInTheDocument();
  });

  it("counts every unfinished request as open", () => {
    render(<ClientDashboard data={data} performance={performance} financials={financials} />);
    const card = screen.getByText("Operations Dashboard").closest("section")!;
    // The fixture holds one in_progress request.
    expect(within(card).getByText("Total open SR")).toBeInTheDocument();
    expect(within(card).getByText("Open right now, across all weeks")).toBeInTheDocument();
  });

  it("marks metrics whose names are not settled yet", () => {
    render(<ClientDashboard data={data} performance={performance} financials={financials} />);
    const card = screen.getByText("Operations Dashboard").closest("section")!;
    expect(within(card).getAllByText("· draft").length).toBeGreaterThan(0);
  });

  it("explains the operations figures in their own legend", () => {
    render(<ClientDashboard data={data} performance={performance} financials={financials} />);
    const legend = screen
      .getByText("Legend — what the operations figures mean")
      .closest("details")!;
    expect(within(legend).getByText("FTC performance")).toBeInTheDocument();
    expect(within(legend).getByText(/First Time Completion/)).toBeInTheDocument();
  });
});

// Finance figures come from the client's partner, not from anything BluBook
// observes, so an unfiled quarter has to look different from a zero one.
describe("ClientDashboard finance dashboard", () => {
  it("computes the ratios from the filed week", () => {
    render(<ClientDashboard data={data} performance={performance} financials={financials} />);
    const card = screen.getByText("Finance Dashboard").closest("section")!;

    // 100 000 + 20 000 - 5 000 formats compactly.
    expect(within(card).getByText("R 115K")).toBeInTheDocument();
    // 400 000 / 800 000, and 500 000 / 250 000. en-ZA writes the decimal
    // separator as a comma, which is the point of formatting in that locale.
    expect(within(card).getByText("0,5")).toBeInTheDocument();
    expect(within(card).getByText("2")).toBeInTheDocument();
    // 2 of 40 customers lost.
    expect(within(card).getByText("5%")).toBeInTheDocument();
  });

  it("says figures are awaited rather than showing zeroes", () => {
    render(<ClientDashboard data={data} performance={performance} financials={noFinancials} />);
    const card = screen.getByText("Finance Dashboard").closest("section")!;

    expect(
      within(card).getByText(/has not filed figures for this quarter yet/),
    ).toBeInTheDocument();
    expect(within(card).queryByText("R 0")).not.toBeInTheDocument();
  });

  it("explains each finance figure in its own legend", () => {
    render(<ClientDashboard data={data} performance={performance} financials={financials} />);
    const legend = screen
      .getByText("Legend — what the finance figures mean")
      .closest("details")!;
    expect(within(legend).getByText("Churn rate")).toBeInTheDocument();
    expect(within(legend).getByText(/client's own customers, not BluBook's/)).toBeInTheDocument();
  });
});
