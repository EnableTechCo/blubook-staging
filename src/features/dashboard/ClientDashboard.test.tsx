import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ClientDashboard } from "@/features/dashboard/ClientDashboard";
import type { ClientDashboardData } from "@/services/dashboard";

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

describe("ClientDashboard", () => {
  it("leads on delivery performance without exposing provider identity", () => {
    render(<ClientDashboard data={data} />);

    expect(screen.getByRole("heading", { level: 1, name: "Maboneng Trading" })).toBeInTheDocument();
    expect(screen.getByText("Active workload").parentElement).toHaveTextContent("1");
    // Services still surface, through the demand breakdown rather than a package.
    expect(screen.getByText("Administration")).toBeInTheDocument();
    expect(screen.queryByText("provider-1")).not.toBeInTheDocument();
  });

  // The package moved off this view; its requests are what the client sees.
  it("no longer lists the package itself", () => {
    render(<ClientDashboard data={data} />);
    expect(screen.queryByText("Operations support")).not.toBeInTheDocument();
    expect(screen.queryByText("Monthly administration")).not.toBeInTheDocument();
  });

  it("keeps empty account states explicit", () => {
    render(
      <ClientDashboard
        data={{ client: null, packages: [], requests: [] }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Your business" })).toBeInTheDocument();
    expect(
      screen.getByText("Performance data will appear when service requests are available."),
    ).toBeInTheDocument();
  });
});
