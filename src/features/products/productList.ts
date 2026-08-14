/**
 * Reading a client's product list out of a spreadsheet.
 *
 * Kept free of any spreadsheet library so the rules can be tested directly on a
 * grid of cells. The library only ever turns a file into that grid.
 *
 * The brief asked for a template covering typical product list formats, which
 * is why headers are matched by alias rather than by exact text. A list
 * exported from anywhere sensible calls the code column "Code", "SKU",
 * "Item code" or "Product code", and rejecting five of those to insist on the
 * sixth would make the template a hurdle rather than a help.
 */

export interface ProductColumn {
  key: "product_code" | "description" | "unit" | "unit_price" | "vat_rate" | "category";
  header: string;
  required: boolean;
  kind: "text" | "number";
  /** Lower-case spellings accepted for this column, beyond the header itself. */
  aliases: readonly string[];
  hint: string;
}

export const PRODUCT_COLUMNS: readonly ProductColumn[] = [
  {
    key: "product_code",
    header: "Product code",
    required: true,
    kind: "text",
    aliases: ["code", "sku", "item code", "product", "item", "stock code", "part number"],
    hint: "Your reference for the product. Must be unique.",
  },
  {
    key: "description",
    header: "Description",
    required: true,
    kind: "text",
    aliases: ["name", "product name", "item description", "details"],
    hint: "What appears on the quotation line.",
  },
  {
    key: "unit",
    header: "Unit",
    required: false,
    kind: "text",
    aliases: ["uom", "unit of measure", "measure", "packing"],
    hint: "Each, box, hour, kg — optional.",
  },
  {
    key: "unit_price",
    header: "Unit price",
    required: true,
    kind: "number",
    aliases: ["price", "rate", "amount", "selling price", "unit cost", "excl vat", "price excl"],
    hint: "Excluding VAT, in Rands.",
  },
  {
    key: "vat_rate",
    header: "VAT rate (%)",
    required: false,
    kind: "number",
    aliases: ["vat", "vat %", "vat percent", "tax", "tax rate"],
    hint: "Leave blank for the standard rate.",
  },
  {
    key: "category",
    header: "Category",
    required: false,
    kind: "text",
    aliases: ["group", "type", "range", "department"],
    hint: "Optional grouping.",
  },
];

export const DEFAULT_VAT_RATE = 15;

export interface ParsedProduct {
  product_code: string;
  description: string;
  unit: string | null;
  unit_price: number;
  vat_rate: number;
  category: string | null;
}

export interface ParseIssue {
  /** 1-based row number as the client sees it in the spreadsheet. */
  row: number;
  message: string;
}

export interface ParseResult {
  products: ParsedProduct[];
  issues: ParseIssue[];
}

type Cell = string | number | boolean | null | undefined;

function normalise(value: Cell): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Money and percentages arrive as text as often as numbers — "R 1 250,00",
 * "1,250.00", "15%". Excel's own cells are numbers, but a list pasted together
 * by hand is whatever the person typed.
 */
export function parseNumber(value: Cell): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const raw = String(value ?? "").trim();
  if (!raw) return null;

  // Keep only what can be part of a number. That covers every currency symbol
  // and the non-breaking space en-ZA uses to group thousands without listing
  // them, and it turns "POA" into nothing rather than into a guess.
  let cleaned = raw.replace(/[^0-9.,-]/g, "");
  // Without this, "POA" cleans to an empty string and Number("") is 0 — a
  // priced product invented out of an unpriced one.
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    // Whichever comes last is the decimal separator; the other groups thousands.
    cleaned =
      lastComma > lastDot
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (lastComma !== -1) {
    // A lone comma is a decimal separator in en-ZA — unless it is grouping,
    // which shows itself by leaving exactly three digits behind it.
    const decimals = cleaned.length - lastComma - 1;
    cleaned = decimals === 3 ? cleaned.replace(/,/g, "") : cleaned.replace(",", ".");
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Maps each column to the index of the spreadsheet column holding it. */
export function mapHeaders(headerRow: Cell[]): {
  indexes: Partial<Record<ProductColumn["key"], number>>;
  missing: string[];
} {
  const seen = headerRow.map(normalise);
  const indexes: Partial<Record<ProductColumn["key"], number>> = {};

  for (const column of PRODUCT_COLUMNS) {
    const accepted = [normalise(column.header), ...column.aliases];
    const index = seen.findIndex((cell) => cell !== "" && accepted.includes(cell));
    if (index !== -1) indexes[column.key] = index;
  }

  const missing = PRODUCT_COLUMNS.filter(
    (column) => column.required && indexes[column.key] === undefined,
  ).map((column) => column.header);

  return { indexes, missing };
}

/**
 * Turns a grid into products, reporting what it could not read rather than
 * dropping it. A list is worth uploading only if the client can trust that what
 * is not flagged went in.
 */
export function parseProductMatrix(matrix: Cell[][]): ParseResult {
  const issues: ParseIssue[] = [];

  // Tolerate title rows and blank lines above the headings.
  const headerIndex = matrix.findIndex((row) => mapHeaders(row).missing.length === 0);
  if (headerIndex === -1) {
    const best = matrix.length > 0 ? mapHeaders(matrix[0]!) : { missing: [] as string[] };
    const missing = best.missing.length > 0 ? best.missing.join(" and ") : "Product code and Unit price";
    return {
      products: [],
      issues: [{ row: 1, message: `No heading row found. The sheet needs columns for ${missing}.` }],
    };
  }

  const { indexes } = mapHeaders(matrix[headerIndex]!);
  const at = (row: Cell[], key: ProductColumn["key"]): Cell => {
    const index = indexes[key];
    return index === undefined ? null : row[index];
  };

  const products: ParsedProduct[] = [];
  const codesSeen = new Map<string, number>();

  for (let index = headerIndex + 1; index < matrix.length; index += 1) {
    const row = matrix[index]!;
    const rowNumber = index + 1;

    // A wholly empty row is the end of the list or a spacer, not an error.
    if (row.every((cell) => String(cell ?? "").trim() === "")) continue;

    const code = String(at(row, "product_code") ?? "").trim();
    const description = String(at(row, "description") ?? "").trim();
    if (!code) {
      issues.push({ row: rowNumber, message: "No product code, so the row was skipped." });
      continue;
    }
    if (!description) {
      issues.push({ row: rowNumber, message: `${code} has no description, so the row was skipped.` });
      continue;
    }

    const price = parseNumber(at(row, "unit_price"));
    if (price === null) {
      issues.push({ row: rowNumber, message: `${code} has no readable unit price, so the row was skipped.` });
      continue;
    }
    if (price < 0) {
      issues.push({ row: rowNumber, message: `${code} has a negative unit price, so the row was skipped.` });
      continue;
    }

    const vat = parseNumber(at(row, "vat_rate"));
    if (vat !== null && (vat < 0 || vat > 100)) {
      issues.push({ row: rowNumber, message: `${code} has a VAT rate outside 0–100, so the row was skipped.` });
      continue;
    }

    // The last spelling of a code wins, and the earlier one is reported rather
    // than silently overwritten — a duplicate is usually a mistake.
    const previous = codesSeen.get(code.toLowerCase());
    if (previous !== undefined) {
      issues.push({
        row: rowNumber,
        message: `${code} also appears on row ${previous}. The later row was used.`,
      });
      const existing = products.findIndex((product) => product.product_code.toLowerCase() === code.toLowerCase());
      if (existing !== -1) products.splice(existing, 1);
    }
    codesSeen.set(code.toLowerCase(), rowNumber);

    const unit = String(at(row, "unit") ?? "").trim();
    const category = String(at(row, "category") ?? "").trim();

    products.push({
      product_code: code,
      description,
      unit: unit || null,
      unit_price: Math.round(price * 100) / 100,
      vat_rate: vat ?? DEFAULT_VAT_RATE,
      category: category || null,
    });
  }

  if (products.length === 0 && issues.length === 0) {
    issues.push({ row: headerIndex + 1, message: "The sheet has headings but no product rows." });
  }

  return { products, issues };
}

/** The blank template: headings, the hint row, and one worked example. */
export function templateRows(): (string | number)[][] {
  return [
    PRODUCT_COLUMNS.map((column) => column.header),
    PRODUCT_COLUMNS.map((column) => column.hint),
    ["ABC-001", "Example product — replace this row", "Each", 1250, 15, "Example"],
  ];
}
