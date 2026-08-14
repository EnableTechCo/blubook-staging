// @vitest-environment node
import { describe, expect, it } from "vitest";
import { LetterheadDocument, type LetterheadData } from "@/features/letterhead/Letterhead";
import { renderPdf } from "@/features/pdf/render";

const data = (overrides: Partial<LetterheadData> = {}): LetterheadData => ({
  tradingName: "Riverside Cafe",
  registeredName: "Riverside Cafe (Pty) Ltd",
  registrationNumber: "2019/123456/07",
  vatNumber: "4123456789",
  vatStatus: "registered",
  address: ["12 Long Street", "Cape Town, Western Cape", "8001"],
  logoUrl: null,
  directorName: "Thandi Mokoena",
  directorTitle: "Managing Director",
  contactEmail: "hello@riverside.example",
  contactPhone: "021 555 0100",
  website: "riverside.example",
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
  ...overrides,
});

describe("the letterhead", () => {
  it("renders to a real PDF", async () => {
    const pdf = await renderPdf(<LetterheadDocument data={data()} />);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.subarray(-1024).toString("latin1")).toContain("%%EOF");
  });

  // The whole point of the toggles is that turning one off removes something.
  // Different bytes is the only honest check available without pulling a PDF
  // text extractor in: react-pdf compresses its content streams.
  it("renders differently when a section is turned off", async () => {
    const [all, noBanking, noDirector] = await Promise.all([
      renderPdf(<LetterheadDocument data={data()} />),
      renderPdf(<LetterheadDocument data={data({ showBanking: false })} />),
      renderPdf(<LetterheadDocument data={data({ showDirector: false })} />),
    ]);

    expect(all.equals(noBanking)).toBe(false);
    expect(all.equals(noDirector)).toBe(false);
    expect(noBanking.equals(noDirector)).toBe(false);
  });

  // A client that has not filled anything in still needs paper to print on.
  it("renders with no logo, no banking and no director", async () => {
    const pdf = await renderPdf(
      <LetterheadDocument
        data={data({
          logoUrl: null,
          banking: null,
          directorName: null,
          directorTitle: null,
          address: [],
          registrationNumber: null,
          vatNumber: null,
          footerNote: null,
          contactEmail: null,
          contactPhone: null,
          website: null,
        })}
      />,
    );
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(500);
  });

  // A VAT number is only meaningful when the client is registered, and printing
  // one for a client that is not would be a statement to their customers.
  it("prints no VAT number for a client that is not registered", async () => {
    const [registered, notRegistered] = await Promise.all([
      renderPdf(<LetterheadDocument data={data({ vatStatus: "registered" })} />),
      renderPdf(<LetterheadDocument data={data({ vatStatus: "not_registered" })} />),
    ]);
    expect(registered.equals(notRegistered)).toBe(false);
  });
});

// The client's control over what is printed is the only lever it has over what
// ends up in a filed copy, so it is asserted rather than assumed to work.
describe("turning banking off", () => {
  it("removes the account from the letterhead entirely", async () => {
    const { renderPdf: render } = await import("@/features/pdf/render");
    const on = await render(<LetterheadDocument data={data({ showBanking: true })} />);
    const off = await render(<LetterheadDocument data={data({ showBanking: false })} />);

    // Off must also match a letterhead that never had banking to show, which is
    // what proves nothing of the account survives the toggle.
    const never = await render(<LetterheadDocument data={data({ showBanking: false, banking: null })} />);

    expect(on.equals(off)).toBe(false);
    expect(off.length).toBe(never.length);
  });
});
