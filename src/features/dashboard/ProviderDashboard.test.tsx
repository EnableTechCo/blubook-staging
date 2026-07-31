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
  workGroups: [{ id: "00000000-0000-0000-0000-000000000030", name: "Finance Group" }],
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

describe("ProviderDashboard work groups", () => {
  it("names the work groups the partner belongs to", () => {
    render(<ProviderDashboard data={data} />);
    expect(screen.getByText("Work groups")).toBeInTheDocument();
    expect(screen.getByText("Finance Group")).toBeInTheDocument();
  });

  it("lists every group when a partner belongs to more than one", () => {
    render(
      <ProviderDashboard
        data={{
          ...data,
          workGroups: [
            { id: "g-1", name: "Finance Group" },
            { id: "g-2", name: "Warehouse Group" },
          ],
        }}
      />,
    );
    expect(screen.getByText("Finance Group")).toBeInTheDocument();
    expect(screen.getByText("Warehouse Group")).toBeInTheDocument();
  });

  // A partner in no group is invisible to routing, so say so rather than
  // showing an empty panel.
  it("explains the consequence when the partner is in no group", () => {
    render(<ProviderDashboard data={{ ...data, workGroups: [] }} />);
    expect(screen.getByText(/not in a work group yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no requests will be routed to you/i)).toBeInTheDocument();
  });
});

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
