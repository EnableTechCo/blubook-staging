import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProviderDashboardData, RequestRow } from "@/services/dashboard";
import { ProviderDashboard } from "@/features/dashboard/ProviderDashboard";

vi.mock("@/features/requests/actions", () => ({
  acceptOffer: vi.fn(),
  rejectOffer: vi.fn(),
  setRequestStatus: vi.fn(),
}));

afterEach(cleanup);

const request = (
  id: string,
  reference: string,
  status: RequestRow["status"],
): RequestRow => ({
  id,
  reference,
  title: `${reference} service request`,
  status,
  origin: "client",
  created_at: "2026-07-28T08:00:00.000Z",
  client_id: "00000000-0000-0000-0000-000000000002",
  provider_id: "00000000-0000-0000-0000-000000000001",
  services: { name: "Company secretarial" },
  providers: { business_name: "Provider Business" },
  clients: { business_name: "Private Client Name" },
  request_schedules: { due_at: "2026-08-04T08:00:00.000Z", eta_type: "static" },
});

const data: ProviderDashboardData = {
  provider: {
    id: "00000000-0000-0000-0000-000000000001",
    business_name: "Provider Business",
    status: "active",
  },
  capabilities: [
    { active: true, services: { name: "Company secretarial" } },
    { active: false, services: { name: "Tax advisory" } },
  ],
  requests: [
    request("00000000-0000-0000-0000-000000000010", "REQ-010", "in_progress"),
    request("00000000-0000-0000-0000-000000000011", "REQ-011", "assigned"),
  ],
  offers: [
    {
      id: "00000000-0000-0000-0000-000000000020",
      status: "offered",
      created_at: "2026-07-28T08:00:00.000Z",
      service_requests: { reference: "REQ-020", title: "Annual return filing" },
    },
  ],
};

describe("ProviderDashboard", () => {
  it("renders provider work and preserves counterparty anonymity", () => {
    render(<ProviderDashboard data={data} />);

    expect(screen.getByRole("heading", { level: 1, name: "Provider Business" })).toBeInTheDocument();
    expect(screen.getByText("Annual return filing")).toBeInTheDocument();
    expect(screen.queryByText("Private Client Name")).not.toBeInTheDocument();
    expect(screen.getByText("Tax advisory").closest("li")).toHaveTextContent("Inactive");
  });

  it("keeps offer actions on the dashboard while request actions move to the tracker", () => {
    render(<ProviderDashboard data={data} />);

    expect(screen.getByRole("button", { name: "Accept offer REQ-020" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject offer REQ-020" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Complete request/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancel request/i })).not.toBeInTheDocument();
  });
});
