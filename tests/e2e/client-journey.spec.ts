import { existsSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/**
 * The client's own path, end to end: letterhead, product list, quotation.
 *
 * Everything here was previously covered by unit and policy tests but never
 * exercised through the rendered application, because doing so needs a real
 * sign-in. This is the spec that closes that gap, and it runs against whatever
 * database the dev server is pointed at.
 *
 * Opt-in, following the auth round-trip already in this directory. Set the two
 * variables in .env.local (gitignored) or in the environment:
 *
 *   E2E_CLIENT_EMAIL=client@blubook.dev
 *   E2E_CLIENT_PASSWORD=...
 *
 * It writes real records — products, a letterhead, quotations, and an
 * opportunity. Everything it creates is named with the E2E_TAG below so it can
 * be found and removed afterwards. Do not point it at production.
 */

const EMAIL = process.env.E2E_CLIENT_EMAIL;
const PASSWORD = process.env.E2E_CLIENT_PASSWORD;

/** Stamped into every record so a run's leftovers are identifiable. */
const TAG = `E2E-${Date.now().toString().slice(-6)}`;

test.describe.configure({ mode: "serial" });

test.describe("the client journey", () => {
  test.skip(
    !EMAIL || !PASSWORD,
    "set E2E_CLIENT_EMAIL and E2E_CLIENT_PASSWORD to run the client journey",
  );

  async function signIn(page: Page): Promise<void> {
    await page.goto("/login/client");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  }

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  // -------------------------------------------------------------------------
  // The letterhead, which everything else is printed onto
  // -------------------------------------------------------------------------

  test("banking details and letterhead save, and the letterhead downloads", async ({ page }) => {
    await page.goto("/dashboard/transact/letterhead");
    await expect(page.getByRole("heading", { level: 1, name: "Create letterhead" })).toBeVisible();

    await page.getByLabel("Bank", { exact: true }).fill("Standard Bank");
    await page.getByLabel("Account name").fill(`Journey Test ${TAG}`);
    await page.getByLabel("Account number").fill("000111222");
    await page.getByLabel("Branch code").fill("051001");
    await page.getByRole("button", { name: /banking details/i }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    await page.getByLabel("Standing footer line", { exact: false }).fill(`Quotations valid 30 days · ${TAG}`);
    await page.getByRole("button", { name: "Save letterhead" }).click();

    // The download is the real check: it exercises the whole render path —
    // banking read under the client's own session, composed onto the frame,
    // through react-pdf, in the Next runtime.
    const download = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: /download the blank letterhead/i }).click(),
    ]).then(([event]) => event);

    const path = await download.path();
    expect(path).toBeTruthy();
    expect(download.suggestedFilename()).toMatch(/letterhead\.pdf$/);
    expect(readFileSync(path!).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  // -------------------------------------------------------------------------
  // The product list a quotation is priced from
  // -------------------------------------------------------------------------

  test("the blank template downloads, uploads back, and its products appear", async ({ page }) => {
    await page.goto("/dashboard/sales/products");
    await expect(page.getByRole("heading", { level: 1, name: "Product list" })).toBeVisible();

    // Round-tripping the template through the real app is the strongest check
    // available: the file we hand out has to survive the reader we hand it to.
    const template = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: /download the blank template/i }).click(),
    ]).then(([event]) => event);

    const templatePath = await template.path();
    expect(templatePath).toBeTruthy();
    expect(existsSync(templatePath!)).toBe(true);

    await page.getByLabel(/Excel file/i).setInputFiles(templatePath!);
    await page.getByRole("button", { name: "Upload list" }).click();

    await expect(page.getByText(/added,.*updated/i)).toBeVisible();
    await expect(page.getByText("Example product — replace this row")).toBeVisible();
  });

  test("a single product can be added by hand", async ({ page }) => {
    await page.goto("/dashboard/sales/products");
    await page.getByText("Add a single product").click();

    await page.getByLabel("Product code").fill(`${TAG}-01`);
    await page.getByLabel("Description").fill(`Journey widget ${TAG}`);
    await page.getByLabel("Unit price (excl VAT)").fill("250");
    await page.getByRole("button", { name: "Add product" }).click();

    await expect(page.getByText(`Journey widget ${TAG}`)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // The quotation itself
  // -------------------------------------------------------------------------

  test("a quotation is raised, priced, and filed as a downloadable PDF", async ({ page }) => {
    await page.goto("/dashboard/transact/quotation");
    await expect(page.getByRole("heading", { level: 1, name: "Create quotation" })).toBeVisible();

    await page.getByLabel("Contact name").fill(`Journey Customer ${TAG}`);
    await page.getByLabel(/^Company/).fill(`Journey Co ${TAG}`);

    // Two of the hand-added product: 2 x 250 = 500 before VAT, 575 after.
    await page.getByLabel(`Quantity of Journey widget ${TAG}`).fill("2");
    await expect(page.getByText(/Subtotal R\s?500,00/)).toBeVisible();

    await page.getByRole("button", { name: "Create quotation" }).click();

    const reference = page.getByText(/QUO-\d{4}-\d{6} raised and filed\./);
    await expect(reference).toBeVisible();

    // The filed copy has to come back as a PDF, which is what proves the render
    // and the archive filing both happened rather than only the row.
    await page.reload();
    const download = await Promise.all([
      page.waitForEvent("download"),
      page
        .getByRole("article")
        .filter({ hasText: `Journey Co ${TAG}` })
        .getByRole("link", { name: "Download" })
        .click(),
    ]).then(([event]) => event);

    const path = await download.path();
    expect(readFileSync(path!).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  test("the filed copy appears in the archive under Quotations", async ({ page }) => {
    await page.goto("/dashboard/documents");
    const title = new RegExp("Quotation QUO-[0-9]{4}-[0-9]{6} . Journey Co " + TAG);
    await expect(page.getByText(title)).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // The pipeline-linked mode
  // -------------------------------------------------------------------------

  test("a linked quotation raises an opportunity for the subtotal", async ({ page }) => {
    await page.goto("/dashboard/transact/quotation");

    await page.getByLabel("Contact name").fill(`Pipeline Customer ${TAG}`);
    await page.getByLabel(/^Company/).fill(`Pipeline Co ${TAG}`);
    await page.getByLabel(`Quantity of Journey widget ${TAG}`).fill("4");

    await page.getByLabel(/add this to my pipeline/i).check();
    await page.getByLabel("Opportunity name").fill(`Journey deal ${TAG}`);
    await page.getByLabel("Source").selectOption({ index: 1 });

    await page.getByRole("button", { name: "Create quotation" }).click();
    await expect(page.getByText(/QUO-\d{4}-\d{6} raised and filed\./)).toBeVisible();

    // 4 x 250 = R1 000 excluding VAT. The pipeline carries revenue, not the
    // VAT-inclusive total, so R1 150 appearing here would be the bug.
    await page.goto("/dashboard/sales/pipeline");
    await expect(page.getByText(`Journey deal ${TAG}`)).toBeVisible();
    await expect(page.getByText(/R\s?1[\s ]000,00/).first()).toBeVisible();
  });
});
