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
    tier: "standard",
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
    // "Work groups" is both the section heading and a stat tile label.
    expect(screen.getByRole("heading", { name: "Work groups" })).toBeInTheDocument();
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
    // Capabilities were removed from this dashboard: work groups decide what
    // reaches a partner, so listing services here said nothing useful.
    expect(screen.queryByText("Capabilities")).not.toBeInTheDocument();
    expect(screen.queryByText("Tax advisory")).not.toBeInTheDocument();
  });

  it("keeps offer actions on the dashboard while request actions move to the tracker", () => {
    render(<ProviderDashboard data={data} />);

    expect(screen.getByRole("button", { name: "Accept offer REQ-020" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject offer REQ-020" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Complete request/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancel request/i })).not.toBeInTheDocument();
  });
});

// The tier is a property of the practice, not of the groups it works in, so it
// is shown once on the partner's own workspace rather than against each group.
describe("ProviderDashboard partnership tier", () => {
  it("names a standard partner as standard", () => {
    render(<ProviderDashboard data={data} />);
    expect(screen.getByText("Standard Partner")).toBeInTheDocument();
    expect(screen.queryByText("Premium Partner")).not.toBeInTheDocument();
  });

  it("names a premium partner as premium", () => {
    render(
      <ProviderDashboard
        data={{ ...data, provider: { ...data.provider!, tier: "premium" } }}
      />,
    );
    expect(screen.getByText("Premium Partner")).toBeInTheDocument();
    expect(screen.queryByText("Standard Partner")).not.toBeInTheDocument();
  });

  it("shows no tier when the practice has no provider record yet", () => {
    render(<ProviderDashboard data={{ ...data, provider: null }} />);
    expect(screen.queryByText("Premium Partner")).not.toBeInTheDocument();
    expect(screen.queryByText("Standard Partner")).not.toBeInTheDocument();
  });
});
