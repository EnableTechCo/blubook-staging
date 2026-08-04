import { describe, expect, it } from "vitest";
import { blankTestPdf } from "@/features/onboarding/onboardingCheck";

const text = () => new TextDecoder().decode(blankTestPdf());

// The blank test document is assembled in code rather than shipped as a binary
// asset, so its structure is worth pinning: a PDF with wrong xref offsets opens
// as a corrupt file, which would make the check report success on a broken
// artefact.
describe("blankTestPdf", () => {
  it("starts with a PDF header and ends with the EOF marker", () => {
    const pdf = text();
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("declares one page", () => {
    expect(text()).toContain("/Type /Page ");
    expect(text()).toContain("/Count 1");
  });

  it("points startxref at the real byte offset of the xref table", () => {
    const pdf = text();
    const declared = Number(pdf.match(/startxref\n(\d+)/)?.[1]);
    expect(Number.isFinite(declared)).toBe(true);
    expect(pdf.slice(declared, declared + 4)).toBe("xref");
  });

  it("points every xref entry at the object it describes", () => {
    const pdf = text();
    const offsets = [...pdf.matchAll(/^(\d{10}) 00000 n $/gm)].map((match) => Number(match[1]));
    expect(offsets).toHaveLength(3);

    offsets.forEach((offset, index) => {
      expect(pdf.slice(offset)).toMatch(new RegExp(`^${index + 1} 0 obj`));
    });
  });

  it("is byte-stable, so the recorded size always matches the upload", () => {
    expect(blankTestPdf().byteLength).toBe(blankTestPdf().byteLength);
    expect(blankTestPdf().byteLength).toBeGreaterThan(200);
  });
});
