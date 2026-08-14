import "server-only";
import { renderToBuffer, StyleSheet, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";

/**
 * Rendering a PDF on the server.
 *
 * react-pdf rather than a headless browser: this runs on Vercel, where keeping
 * a Chromium binary alive is a deployment problem rather than a rendering one.
 * The cost is that PDFs are laid out with react-pdf's own primitives rather
 * than with the app's CSS, which is why the page styles below are defined once
 * here instead of being reached for per document.
 *
 * Everything a client downloads goes through this one function, so page size,
 * margins and the type scale cannot drift between a quotation and a notice.
 */
export async function renderPdf(document: ReactElement<DocumentProps>): Promise<Buffer> {
  return renderToBuffer(document);
}

/** A4 at 72dpi, which is the unit react-pdf measures in. */
export const A4 = { width: 595.28, height: 841.89 } as const;

/**
 * The shared type scale and spacing.
 *
 * Helvetica because it is one of the fourteen fonts every PDF reader carries,
 * so a document renders identically without embedding anything or waiting on a
 * font to load mid-render.
 */
export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1c1c1c",
    lineHeight: 1.5,
  },
  heading: { fontFamily: "Helvetica-Bold", fontSize: 20, marginBottom: 4 },
  subheading: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 6 },
  label: { fontSize: 7.5, letterSpacing: 0.6, color: "#6b6b6b", textTransform: "uppercase" },
  muted: { color: "#6b6b6b" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rule: { borderBottomWidth: 1, borderBottomColor: "#1c1c1c", marginVertical: 14 },
  hairline: { borderBottomWidth: 0.5, borderBottomColor: "#c9c9c9" },

  // Page numbers sit in the footer of every document, because a quotation that
  // arrives as loose pages should say which of them is missing.
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    fontSize: 7.5,
    color: "#6b6b6b",
  },
});

/** Rands, matching how amounts are written everywhere else in the product. */
export function pdfMoney(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(value);
}
