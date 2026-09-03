import { describe, expect, it, vi } from "vitest";
import { pdfArtworkSource } from "@/features/letterhead/pdfArtwork";

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><rect width="12" height="12" fill="#1754c7"/></svg>';

describe("PDF artwork", () => {
  it("uses PNG and JPEG artwork directly in generated documents", async () => {
    await expect(pdfArtworkSource("client/mark.png")).resolves.toContain("/artwork/client/mark.png");
    await expect(pdfArtworkSource("client/mark.JPEG")).resolves.toContain("/artwork/client/mark.JPEG");
  });

  it("rasterizes SVG artwork into a PNG for generated documents", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(SVG, { status: 200 })));

    const result = await pdfArtworkSource("client/mark.svg");

    expect(Buffer.isBuffer(result)).toBe(true);
    expect((result as Buffer).subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
    vi.unstubAllGlobals();
  });

  it("keeps a missing or unreadable logo from blocking PDF generation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Not found", { status: 404 })));

    await expect(pdfArtworkSource("client/mark.svg")).resolves.toBeNull();
    await expect(pdfArtworkSource(null)).resolves.toBeNull();
    vi.unstubAllGlobals();
  });
});