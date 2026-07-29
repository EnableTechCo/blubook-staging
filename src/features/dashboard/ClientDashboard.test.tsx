import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientDashboard } from "@/features/dashboard/ClientDashboard";
import type { ClientDashboardData } from "@/services/dashboard";

vi.mock("@/features/documents/actions", () => ({
  uploadDocument: vi.fn(),
}));

afterEach(cleanup);

const data: ClientDashboardData = {
  client: {
    id: "client-1",
    business_name: "Maboneng Trading",
    status: "active",
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
  onboardings: [
    {
      id: "onboarding-1",
      status: "in_progress",
      onboarding_documents: [
        {
          id: "document-1",
          status: "outstanding",
          document_type_id: "type-1",
          compliance_document_types: { name: "Company registration" },
        },
      ],
    },
  ],
};

describe("ClientDashboard", () => {
  it("presents the live client account without exposing provider identity", () => {
    render(<ClientDashboard data={data} />);

    expect(screen.getByRole("heading", { level: 1, name: "Maboneng Trading" })).toBeInTheDocument();
    expect(screen.getByText("Operations support")).toBeInTheDocument();
    expect(screen.getByText("REQ-1042")).toBeInTheDocument();
    expect(screen.getByText("Assigned")).toBeInTheDocument();
    expect(screen.queryByText("provider-1")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/account overview/i)).toHaveTextContent(
      "Documents requiring attention",
    );
  });

  it("keeps empty account states explicit", () => {
    render(
      <ClientDashboard
        data={{ client: null, packages: [], requests: [], onboardings: [] }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Your business" })).toBeInTheDocument();
    expect(screen.getByText("No service packages yet.")).toBeInTheDocument();
    expect(screen.getByText("No service requests yet.")).toBeInTheDocument();
    expect(
      screen.getByText("No onboarding record is attached to this account."),
    ).toBeInTheDocument();
  });
});
