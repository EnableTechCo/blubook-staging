import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ClientDashboard } from "@/features/dashboard/ClientDashboard";
import type { ClientDashboardData } from "@/services/dashboard";
import type { SalesPerformanceData } from "@/features/sales/types";

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
  error: null,
};

const emptyPerformance: SalesPerformanceData = {
  ...performance,
  opportunities: [],
  target: null,
};

describe("ClientDashboard", () => {
  it("leads on delivery performance without exposing provider identity", () => {
    render(<ClientDashboard data={data} performance={performance} />);

    expect(screen.getByRole("heading", { level: 1, name: "Maboneng Trading" })).toBeInTheDocument();
    expect(screen.getByText("Active workload").parentElement).toHaveTextContent("1");
    // Services still surface, through the demand breakdown rather than a package.
    expect(screen.getByText("Administration")).toBeInTheDocument();
    expect(screen.queryByText("provider-1")).not.toBeInTheDocument();
  });

  // The package moved off this view; its requests are what the client sees.
  it("no longer lists the package itself", () => {
    render(<ClientDashboard data={data} performance={performance} />);
    expect(screen.queryByText("Operations support")).not.toBeInTheDocument();
    expect(screen.queryByText("Monthly administration")).not.toBeInTheDocument();
  });

  it("keeps empty account states explicit", () => {
    render(
      <ClientDashboard
        data={{ client: null, packages: [], requests: [] }}
        performance={emptyPerformance}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Your business" })).toBeInTheDocument();
    expect(
      screen.getByText("Performance data will appear when service requests are available."),
    ).toBeInTheDocument();
  });
});

// The brief's Dash Landing Page leads on sales, above delivery performance.
describe("ClientDashboard sales dash", () => {
  it("leads with the quarter's delivered revenue and its target", () => {
    render(<ClientDashboard data={data} performance={performance} />);

    expect(screen.getByText("Sales Dash")).toBeInTheDocument();
    expect(screen.getByText("Q2 · week 11 of 13")).toBeInTheDocument();
    expect(screen.getByText("QTD sales phasing")).toBeInTheDocument();
    expect(screen.getByText("Week 11 commit")).toBeInTheDocument();
  });

  it("says the target is unset rather than showing a misleading zero", () => {
    render(<ClientDashboard data={data} performance={emptyPerformance} />);
    expect(
      screen.getByText(/Set a target to measure it against/),
    ).toBeInTheDocument();
  });
});
