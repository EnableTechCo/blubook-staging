// @vitest-environment node
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { A4, pdfMoney, pdfStyles, renderPdf } from "@/features/pdf/render";

const sample = (title: string, pages = 1) => (
  <Document>
    {Array.from({ length: pages }, (_, index) => (
      <Page key={index} size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.heading}>{title}</Text>
        <View style={pdfStyles.rule} />
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Total</Text>
          <Text>{pdfMoney(1250.5)}</Text>
        </View>
        <Text
          style={pdfStyles.footer}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    ))}
  </Document>
);

describe("rendering a PDF", () => {
  it("produces a real PDF file", async () => {
    const buffer = await renderPdf(sample("Quotation"));

    // A PDF is recognised by its header and closed by its trailer. Checking
    // both is what distinguishes a finished document from a truncated one.
    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(buffer.subarray(-1024).toString("latin1")).toContain("%%EOF");
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("renders every page it is given", async () => {
    const one = await renderPdf(sample("One"));
    const three = await renderPdf(sample("Three", 3));

    const countPages = (buffer: Buffer) =>
      (buffer.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

    expect(countPages(one)).toBe(1);
    expect(countPages(three)).toBe(3);
  });

  // Documents are built per client from per client data, so identical output
  // for different input would mean something is being cached that should not be.
  it("renders different content to different bytes", async () => {
    const [a, b] = await Promise.all([renderPdf(sample("Client A")), renderPdf(sample("Client B"))]);
    expect(a.equals(b)).toBe(false);
  });

  it("uses A4 at the size react-pdf measures in", () => {
    expect(A4.width).toBeCloseTo(595.28);
    expect(A4.height).toBeCloseTo(841.89);
  });
});

describe("amounts on a document", () => {
  // The same convention as the rest of the product: en-ZA groups thousands with
  // a non-breaking space and marks decimals with a comma.
  it("writes Rands the way everything else does", () => {
    expect(pdfMoney(1250.5)).toMatch(/^R/);
    expect(pdfMoney(1250.5)).toMatch(/1[\s ]250,50/);
    expect(pdfMoney(0)).toMatch(/0,00/);
  });
});
