// @vitest-environment node
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  buildProductTemplate,
  productFileError,
  readProductWorkbook,
} from "@/features/products/productWorkbook";

const asFile = (buffer: Buffer, name = "products.xlsx") =>
  new File([new Uint8Array(buffer)], name);

async function workbookOf(rows: (string | number | null)[][]): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  rows.forEach((row) => sheet.addRow(row));
  return asFile(Buffer.from(await workbook.xlsx.writeBuffer()));
}

describe("what the upload will accept", () => {
  it("takes a spreadsheet", () => {
    expect(productFileError(new File([], "list.xlsx"))).toBeNull();
    expect(productFileError(new File([], "LIST.XLSX"))).toBeNull();
  });

  it("refuses anything else, by extension rather than mime type", () => {
    expect(productFileError(new File([], "list.pdf"))).toMatch(/must be an Excel file/);
    expect(productFileError(new File([], "list.csv"))).toMatch(/must be an Excel file/);
  });

  it("refuses an oversized file", () => {
    const big = new File([new Uint8Array(6 * 1024 * 1024)], "list.xlsx");
    expect(productFileError(big)).toMatch(/5MB/);
  });
});

describe("the template", () => {
  // The strongest single check on this layer: the file we hand out has to
  // survive the reader we hand it back to.
  it("round-trips through its own reader", async () => {
    const template = await buildProductTemplate();
    const { products, issues } = await readProductWorkbook(asFile(template));

    expect(issues).toEqual([]);
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      product_code: "ABC-001",
      unit: "Each",
      unit_price: 1250,
      vat_rate: 15,
    });
  });
});

describe("reading a real workbook", () => {
  it("reads headings and rows", async () => {
    const file = await workbookOf([
      ["Product code", "Description", "Unit", "Unit price", "VAT rate (%)", "Category"],
      ["A-1", "Blue widget", "Each", 100, 15, "Widgets"],
      ["A-2", "Red widget", "Box", 250, 0, null],
    ]);

    const { products, issues } = await readProductWorkbook(file);
    expect(issues).toEqual([]);
    expect(products.map((product) => product.product_code)).toEqual(["A-1", "A-2"]);
    expect(products[1]!.vat_rate).toBe(0);
  });

  // exceljs skips blank rows when iterating, so a gap in the middle would shift
  // every later row number unless the grid is built by index.
  it("keeps row numbers honest across a blank row", async () => {
    const file = await workbookOf([
      ["Product code", "Description", "Unit price"],
      ["A-1", "Fine", 100],
      [null, null, null],
      ["A-2", "No price", "POA"],
    ]);

    const { products, issues } = await readProductWorkbook(file);
    expect(products).toHaveLength(1);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.row).toBe(4);
  });

  it("says so plainly when the file is not a workbook at all", async () => {
    const { products, issues } = await readProductWorkbook(
      new File([new Uint8Array([1, 2, 3, 4])], "not-really.xlsx"),
    );
    expect(products).toEqual([]);
    expect(issues[0]!.message).toMatch(/could not be opened/);
  });
});
