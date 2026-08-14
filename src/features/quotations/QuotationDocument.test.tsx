// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { LetterheadData } from "@/features/letterhead/Letterhead";
import { renderPdf } from "@/features/pdf/render";
import { QuotationDocument, type QuotationDocumentData } from "@/features/quotations/QuotationDocument";

const letterhead: LetterheadData = {
  tradingName: "Riverside Cafe",
  registeredName: "Riverside Cafe (Pty) Ltd",
  registrationNumber: "2019/123456/07",
  vatNumber: "4123456789",
  vatStatus: "registered",
  address: ["12 Long Street", "Cape Town", "8001"],
  logoUrl: null,
  directorName: "Thandi Mokoena",
  directorTitle: "Managing Director",
  contactEmail: "hello@riverside.example",
  contactPhone: "021 555 0100",
  website: null,
  footerNote: "All quotations valid for 30 days.",
  banking: {
    bankName: "Standard Bank",
    accountName: "Riverside Cafe",
    accountNumber: "000111222",
    branchCode: "051001",
    accountType: "Cheque",
    swiftCode: null,
  },
  showBanking: true,
  showRegistration: true,
  showDirector: true,
};

const line = (over: Partial<QuotationDocumentData["lines"][number]> = {}) => ({
  product_code: "A-1",
  description: "Blue widget",
  unit: "Each",
  quantity: 2,
  unit_price: 100,
  vat_rate: 15,
  line_total: 200,
  ...over,
});

const quotation = (over: Partial<QuotationDocumentData> = {}): QuotationDocumentData => ({
  reference: "QUO-2026-000001",
  issueDate: "2026-08-14",
  expiresAt: "2026-09-13",
  recipientName: "Sipho Ndlovu",
  recipientCompany: "Ndlovu Catering",
  recipientEmail: "sipho@ndlovu.example",
  recipientAddress: "5 Market Road\nDurban",
  notes: "Delivery within 14 days of acceptance.",
  lines: [line()],
  subtotal: 200,
  vatTotal: 30,
  total: 230,
  ...over,
});

describe("a quotation on the letterhead", () => {
  it("renders to a real PDF", async () => {
    const pdf = await renderPdf(<QuotationDocument letterhead={letterhead} quotation={quotation()} />);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.subarray(-1024).toString("latin1")).toContain("%%EOF");
  });

  // The whole design is that a quotation is contents on somebody's paper. If
  // the letterhead changed and the quotation did not, the two are not joined.
  it("changes when the letterhead changes", async () => {
    const [withBanking, withoutBanking] = await Promise.all([
      renderPdf(<QuotationDocument letterhead={letterhead} quotation={quotation()} />),
      renderPdf(
        <QuotationDocument
          letterhead={{ ...letterhead, showBanking: false }}
          quotation={quotation()}
        />,
      ),
    ]);
    expect(withBanking.equals(withoutBanking)).toBe(false);
  });

  it("changes when the lines change", async () => {
    const [one, two] = await Promise.all([
      renderPdf(<QuotationDocument letterhead={letterhead} quotation={quotation()} />),
      renderPdf(
        <QuotationDocument
          letterhead={letterhead}
          quotation={quotation({
            lines: [line(), line({ product_code: "A-2", description: "Red widget" })],
            subtotal: 400,
            vatTotal: 60,
            total: 460,
          })}
        />,
      ),
    ]);
    expect(one.equals(two)).toBe(false);
  });

  // A long list has to keep the letterhead's footer on every page rather than
  // running off the first one.
  it("carries a long quotation across pages", async () => {
    const many = Array.from({ length: 60 }, (_, index) =>
      line({ product_code: `A-${index}`, description: `Widget number ${index}` }),
    );
    const pdf = await renderPdf(
      <QuotationDocument letterhead={letterhead} quotation={quotation({ lines: many })} />,
    );
    const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    expect(pages).toBeGreaterThan(1);
  });

  it("renders without the optional parts", async () => {
    const pdf = await renderPdf(
      <QuotationDocument
        letterhead={letterhead}
        quotation={quotation({
          recipientCompany: null,
          recipientEmail: null,
          recipientAddress: null,
          notes: null,
        })}
      />,
    );
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
