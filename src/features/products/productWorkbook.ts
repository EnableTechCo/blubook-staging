import "server-only";
import ExcelJS from "exceljs";
import {
  PRODUCT_COLUMNS,
  parseProductMatrix,
  templateRows,
  type ParseResult,
} from "@/features/products/productList";

export const MAX_PRODUCT_UPLOAD_BYTES = 5 * 1024 * 1024;

// Browsers disagree about the mime type of a spreadsheet, and some send none at
// all, so the extension is what this is judged on.
const ACCEPTED_EXTENSIONS = [".xlsx", ".xlsm"];

export function productFileError(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return "The product list must be an Excel file (.xlsx).";
  }
  if (file.size > MAX_PRODUCT_UPLOAD_BYTES) {
    return "The product list exceeds the 5MB limit.";
  }
  return null;
}

/**
 * A cell's value as text or a number.
 *
 * exceljs hands back objects for anything that is not plain — a formula cell
 * carries its result, rich text carries runs, a hyperlink carries its caption.
 * A price computed by a formula is exactly the case a real price list hits, so
 * unwrapping these is not an edge case.
 */
function cellValue(value: ExcelJS.CellValue): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "object") {
    if ("result" in value && value.result !== undefined) {
      return cellValue(value.result as ExcelJS.CellValue);
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((run) => run.text).join("");
    }
    if ("text" in value && typeof value.text === "string") return value.text;
  }

  return null;
}

/** Reads the first worksheet into a grid, then applies the parsing rules. */
export async function readProductWorkbook(file: File): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return {
      products: [],
      issues: [{ row: 1, message: "That file could not be opened as an Excel workbook." }],
    };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { products: [], issues: [{ row: 1, message: "The workbook has no sheets." }] };
  }

  // eachRow skips blank rows and reports the real row numbers, so the grid is
  // built by index rather than by pushing — otherwise a blank line in the
  // middle would shift every row number the client is told about.
  const matrix: (string | number | null)[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells: (string | number | null)[] = [];
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      cells[columnNumber - 1] = cellValue(cell.value);
    });
    matrix[rowNumber - 1] = cells;
  });

  for (let index = 0; index < matrix.length; index += 1) {
    if (!matrix[index]) matrix[index] = [];
  }

  return parseProductMatrix(matrix);
}

/** The blank template the upload is documented against. */
export async function buildProductTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BluBook";
  const sheet = workbook.addWorksheet("Product list");

  const [headers, hints, example] = templateRows();
  sheet.addRow(headers);
  sheet.addRow(example);
  sheet.getRow(1).font = { bold: true };

  // The hints are notes on the headings rather than a row of their own. As a
  // row they would be read back as a product on the next upload — an unpriced
  // one called "Your reference for the product" — so the template would fail
  // its own parser.
  hints!.forEach((hint, index) => {
    sheet.getRow(1).getCell(index + 1).note = String(hint);
  });

  sheet.columns = PRODUCT_COLUMNS.map((column) => ({
    width: Math.max(column.header.length + 4, column.key === "description" ? 42 : 16),
  }));

  // The client types over the example rather than beside it, so the heading row
  // stays in view while they scroll.
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
