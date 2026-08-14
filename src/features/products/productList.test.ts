import { describe, expect, it } from "vitest";
import {
  DEFAULT_VAT_RATE,
  mapHeaders,
  parseNumber,
  parseProductMatrix,
  templateRows,
} from "@/features/products/productList";

const HEADERS = ["Product code", "Description", "Unit", "Unit price", "VAT rate (%)", "Category"];

describe("reading numbers a person typed", () => {
  it("takes a plain number as it is", () => {
    expect(parseNumber(1250)).toBe(1250);
    expect(parseNumber("1250")).toBe(1250);
  });

  // en-ZA groups thousands with spaces and marks decimals with a comma, so the
  // most ordinary South African price list is the hardest case.
  it("reads en-ZA currency", () => {
    expect(parseNumber("R 1 250,00")).toBe(1250);
    expect(parseNumber("R1 250,50")).toBe(1250.5);
  });

  it("reads the other convention too", () => {
    expect(parseNumber("1,250.00")).toBe(1250);
    expect(parseNumber("$1,250.75")).toBe(1250.75);
  });

  // A lone comma is ambiguous. Three digits behind it is grouping; anything
  // else is a decimal separator.
  it("tells grouping from decimals when only a comma is present", () => {
    expect(parseNumber("1,250")).toBe(1250);
    expect(parseNumber("12,5")).toBe(12.5);
  });

  it("reads a percentage", () => {
    expect(parseNumber("15%")).toBe(15);
  });

  it("returns null rather than a guess for anything unreadable", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("  ")).toBeNull();
    expect(parseNumber("POA")).toBeNull();
    expect(parseNumber(null)).toBeNull();
  });
});

describe("finding the columns", () => {
  it("accepts the template's own headings", () => {
    expect(mapHeaders(HEADERS).missing).toEqual([]);
  });

  // The brief asked for a template covering typical formats, so a list exported
  // from somewhere else should not have to be retyped.
  it("accepts the spellings other systems use", () => {
    const { indexes, missing } = mapHeaders(["SKU", "Name", "UOM", "Price", "VAT", "Group"]);
    expect(missing).toEqual([]);
    expect(indexes.product_code).toBe(0);
    expect(indexes.description).toBe(1);
    expect(indexes.unit_price).toBe(3);
    expect(indexes.vat_rate).toBe(4);
  });

  it("is not thrown by case or extra spacing", () => {
    expect(mapHeaders(["  PRODUCT   CODE ", "description", "unit", "unit price"]).missing).toEqual([]);
  });

  it("names what is missing rather than failing silently", () => {
    expect(mapHeaders(["Description", "Unit"]).missing).toEqual(["Product code", "Unit price"]);
  });
});

describe("reading a product list", () => {
  it("reads a clean sheet", () => {
    const { products, issues } = parseProductMatrix([
      HEADERS,
      ["ABC-001", "Blue widget", "Each", 125.5, 15, "Widgets"],
      ["ABC-002", "Red widget", "Box", "R 1 250,00", "", ""],
    ]);

    expect(issues).toEqual([]);
    expect(products).toEqual([
      {
        product_code: "ABC-001",
        description: "Blue widget",
        unit: "Each",
        unit_price: 125.5,
        vat_rate: 15,
        category: "Widgets",
      },
      {
        product_code: "ABC-002",
        description: "Red widget",
        unit: "Box",
        unit_price: 1250,
        vat_rate: DEFAULT_VAT_RATE,
        category: null,
      },
    ]);
  });

  // Exported sheets routinely carry a company name and a blank line above the
  // headings.
  it("finds the headings under a title row", () => {
    const { products, issues } = parseProductMatrix([
      ["Acme Trading — price list", "", "", "", "", ""],
      ["", "", "", "", "", ""],
      HEADERS,
      ["ABC-001", "Blue widget", "Each", 100, 15, ""],
    ]);

    expect(issues).toEqual([]);
    expect(products).toHaveLength(1);
  });

  it("skips blank rows without complaining about them", () => {
    const { products, issues } = parseProductMatrix([
      HEADERS,
      ["ABC-001", "Blue widget", "Each", 100, 15, ""],
      ["", "", "", "", "", ""],
      ["ABC-002", "Red widget", "Each", 200, 15, ""],
    ]);

    expect(issues).toEqual([]);
    expect(products).toHaveLength(2);
  });

  // A skipped row is reported with the number the client sees in Excel, so it
  // can be found and fixed.
  it("reports what it could not read, by row number", () => {
    const { products, issues } = parseProductMatrix([
      HEADERS,
      ["", "No code here", "Each", 100, 15, ""],
      ["ABC-002", "", "Each", 100, 15, ""],
      ["ABC-003", "No price", "Each", "POA", 15, ""],
      ["ABC-004", "Fine", "Each", 100, 15, ""],
    ]);

    expect(products).toHaveLength(1);
    expect(products[0]!.product_code).toBe("ABC-004");
    expect(issues.map((issue) => issue.row)).toEqual([2, 3, 4]);
    expect(issues[0]!.message).toMatch(/no product code/i);
    expect(issues[1]!.message).toMatch(/ABC-002 has no description/);
    expect(issues[2]!.message).toMatch(/no readable unit price/i);
  });

  it("refuses a negative price and a VAT rate outside 0–100", () => {
    const { products, issues } = parseProductMatrix([
      HEADERS,
      ["ABC-001", "Negative", "Each", -5, 15, ""],
      ["ABC-002", "Silly VAT", "Each", 100, 150, ""],
    ]);

    expect(products).toEqual([]);
    expect(issues).toHaveLength(2);
  });

  // A duplicate code is usually a mistake, and the row that would have been
  // silently discarded is the one worth naming.
  it("keeps the later of two rows sharing a code, and says so", () => {
    const { products, issues } = parseProductMatrix([
      HEADERS,
      ["ABC-001", "First spelling", "Each", 100, 15, ""],
      ["ABC-001", "Second spelling", "Each", 200, 15, ""],
    ]);

    expect(products).toHaveLength(1);
    expect(products[0]!.description).toBe("Second spelling");
    expect(issues[0]!.message).toMatch(/also appears on row 2/);
  });

  it("says so when the sheet has headings and nothing under them", () => {
    const { products, issues } = parseProductMatrix([HEADERS]);
    expect(products).toEqual([]);
    expect(issues[0]!.message).toMatch(/no product rows/i);
  });

  it("says what is missing when there are no usable headings at all", () => {
    const { products, issues } = parseProductMatrix([
      ["Thing", "Notes"],
      ["a", "b"],
    ]);
    expect(products).toEqual([]);
    expect(issues[0]!.message).toMatch(/No heading row found/);
  });
});

describe("the blank template", () => {
  it("leads with the headings the parser accepts", () => {
    const rows = templateRows();
    expect(mapHeaders(rows[0]!).missing).toEqual([]);
  });

  // The example row has to survive its own parser, or the template teaches a
  // format the upload then rejects.
  it("parses its own example row", () => {
    const rows = templateRows();
    const { products, issues } = parseProductMatrix([rows[0]!, rows[2]!]);
    expect(issues).toEqual([]);
    expect(products).toHaveLength(1);
    expect(products[0]!.unit_price).toBe(1250);
  });
});
