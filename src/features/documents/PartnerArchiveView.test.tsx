import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PartnerArchiveView } from "@/features/documents/PartnerArchiveView";
import type { CustomerFolder } from "@/features/documents/partnerArchive";

const folders: CustomerFolder[] = [
  {
    clientId: "cli-a",
    name: "CUS-000001",
    reference: "CUS-000001",
    documentCount: 2,
    requestCount: 1,
    lastActivity: "2026-09-03T10:00:00Z",
    groups: [
      {
        kind: "invoice",
        label: "Invoices",
        description: "Invoices you issued on completed sales orders.",
        documents: [
          {
            id: "d3", title: "Invoice INV-22", kind: "invoice", createdAt: "2026-09-03T10:00:00Z", from: "you",
            request: { id: "r2", reference: "CLI-000002", requestType: "sales_order", workOrder: "WO-000009" },
          },
        ],
      },
      {
        kind: "tender_pack",
        label: "Tender packs",
        description: "Tender, RFFA and RFQ documents the customer shared with you.",
        documents: [
          {
            id: "d1", title: "Tender pack.pdf", kind: "tender_pack", createdAt: "2026-09-01T10:00:00Z", from: "customer",
            request: { id: "r1", reference: "CLI-000001", requestType: "tender_submission", workOrder: null },
          },
        ],
      },
    ],
  },
  {
    clientId: "cli-b",
    name: "Ridge Foods",
    reference: "CUS-000002",
    documentCount: 1,
    requestCount: 1,
    lastActivity: "2026-08-20T10:00:00Z",
    groups: [],
  },
];

afterEach(cleanup);

describe("PartnerArchiveView", () => {
  it("lists a card per customer with counts, showing the Customer ID under a business name", () => {
    render(<PartnerArchiveView folders={folders} />);
    const cards = screen.getAllByRole("listitem");
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText("CUS-000001")).toBeInTheDocument();
    expect(within(cards[0]).getByText("2 docs")).toBeInTheDocument();
    expect(within(cards[1]).getByText("Ridge Foods")).toBeInTheDocument();
    expect(within(cards[1]).getByText("CUS-000002")).toBeInTheDocument();
    expect(within(cards[0]).getByRole("link")).toHaveAttribute("href", "/dashboard/documents?customer=cli-a");
  });

  it("opens a customer as sections by kind, each row linking to its request and download", () => {
    render(<PartnerArchiveView folders={folders} customerId="cli-a" />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("CUS-000001");
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Invoices1", "Tender packs1"]);

    const invoices = screen.getByRole("region", { name: /Invoices/ });
    expect(within(invoices).getByRole("link", { name: "CLI-000002" })).toHaveAttribute("href", "/dashboard/reports/requests/r2");
    expect(within(invoices).getByText("WO-000009")).toBeInTheDocument();
    expect(within(invoices).getByRole("link", { name: "Download" })).toHaveAttribute("href", "/api/documents/d3");
  });

  it("explains the empty archive rather than showing nothing", () => {
    render(<PartnerArchiveView folders={[]} />);
    expect(screen.getByText(/No customer folders yet/)).toBeInTheDocument();
  });
});
