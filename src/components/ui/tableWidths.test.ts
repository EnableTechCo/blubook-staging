import { readFileSync } from "node:fs";
import { join } from "node:path";
import { globSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Every wide table in this app had the same defect: a min-width larger than the
 * page it sat in, so it scrolled sideways on any normal screen and carried its
 * last column — the actions — off the edge. A record could be read and not
 * acted on.
 *
 * One grid is allowed to keep it. The service request table is twenty fields
 * across many requests, which is a comparison job, and comparing is what a grid
 * is for; it is scrolled deliberately, says so, and pins its headings on both
 * axes so nothing is read unlabelled.
 *
 * Anything else declaring a min-width on a table is the old mistake coming
 * back, which is quiet enough to deserve a test rather than a code review.
 */
const ALLOWED = new Set(["src/features/dashboard/RequestsTable.tsx"]);

const sources = globSync("src/**/*.tsx", { cwd: process.cwd() })
  .map((relative) => relative.split("\\").join("/"))
  .filter((relative) => !relative.endsWith(".test.tsx"));

describe("table widths", () => {
  it("finds the components to check", () => {
    expect(sources.length).toBeGreaterThan(20);
    expect(sources).toContain("src/features/dashboard/RequestsTable.tsx");
  });

  it("leaves no table wider than the page it sits in", () => {
    const offenders = sources.filter((relative) => {
      if (ALLOWED.has(relative)) return false;
      const source = readFileSync(join(process.cwd(), relative), "utf8");
      return /<table[^>]*min-w-\[/.test(source);
    });

    expect(offenders).toEqual([]);
  });

  // The exception earns itself: it is only defensible while both axes stay
  // labelled, so the grid that keeps its width has to keep its sticky headings.
  it("keeps the one allowed grid oriented on both axes", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/dashboard/RequestsTable.tsx"),
      "utf8",
    );

    expect(source).toMatch(/sticky[^"]*top-0/);
    expect(source).toMatch(/sticky[^"]*left-0/);
    expect(source).toMatch(/max-h-\[/);
  });
});
