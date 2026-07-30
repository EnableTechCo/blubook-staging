import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RequestRow } from "@/services/dashboard";
import { RequestsTable } from "@/features/dashboard/RequestsTable";

// Rows navigate to the request detail page on click, so the table pulls in the
// app router. Nothing here exercises navigation.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

const row = (overrides: Partial<RequestRow> = {}): RequestRow => ({
  id: "00000000-0000-0000-0000-00000000000a",
  reference: "SYS-000001",
  title: "Monthly reconciliation",
  status: "open",
  origin: "system",
  created_at: "2026-07-30T08:00:00.000Z",
  client_id: "00000000-0000-0000-0000-000000000002",
  provider_id: "00000000-0000-0000-0000-000000000001",
  services: { name: "Bookkeeping", service_groups: { name: "Finance Group" } },
  providers: { business_name: "Sterling Accounts" },
  clients: { business_name: "Private Client Name" },
  request_schedules: { due_at: "2026-08-06T08:00:00.000Z", eta_type: "static" },
  ...overrides,
});

function cellText(column: string): string {
  const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.trim());
  const index = headers.findIndex((h) => h === column);
  const bodyRow = screen.getAllByRole("row")[1];
  return within(bodyRow).getAllByRole("cell")[index]?.textContent?.trim() ?? "";
}

const resolverCellText = () => cellText("Resolver");

// Request type distinguishes a system-generated request from one entered by
// hand. It replaced a column that always read "General".
describe("RequestsTable request type column", () => {
  it("reads System for a request generated off a package line item", () => {
    render(<RequestsTable rows={[row({ origin: "system" })]} view="client" />);
    expect(cellText("Request type")).toBe("System");
  });

  it("reads Direct for a request the client raised manually", () => {
    render(<RequestsTable rows={[row({ origin: "client" })]} view="client" />);
    expect(cellText("Request type")).toBe("Direct");
  });

  it("no longer renders a separate Source column", () => {
    render(<RequestsTable rows={[row()]} view="staff" />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.trim());
    expect(headers).not.toContain("Source");
    expect(headers).toContain("Request type");
  });
});

// The Resolver column says what kind of party resolves the request, not who it
// is by name — so it reads the same for every viewer.
describe("RequestsTable resolver column", () => {
  it("reads Service Partner once a partner holds the request", () => {
    render(<RequestsTable rows={[row()]} view="client" />);
    expect(resolverCellText()).toBe("Service Partner");
  });

  it("reads Work Group while the request is still in the group queue", () => {
    render(
      <RequestsTable
        rows={[row({ provider_id: null, status: "awaiting_assignment" })]}
        view="staff"
      />,
    );
    expect(resolverCellText()).toBe("Work Group");
  });

  it("reads Unassigned when no work group owns the service", () => {
    render(
      <RequestsTable
        rows={[row({ provider_id: null, services: { name: "Bookkeeping" } })]}
        view="staff"
      />,
    );
    expect(resolverCellText()).toBe("Unassigned");
  });

  it("never names the partner, so staff and client read the same value", () => {
    render(<RequestsTable rows={[row()]} view="staff" />);
    expect(resolverCellText()).toBe("Service Partner");
    expect(screen.queryByText("Sterling Accounts")).toBeNull();
  });
});
