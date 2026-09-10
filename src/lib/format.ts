import { SAST_LOCALE } from "@/lib/time";

/**
 * Display formatting with no React in it.
 *
 * These lived in features/dashboard/ui.tsx beside the workspace components,
 * and six other features imported them from there — which is how a "dashboard"
 * feature came to have 23 cross-feature importers. Pure helpers belong in lib,
 * where anything may depend on them and they depend on nothing above.
 */

const currency = new Intl.NumberFormat(SAST_LOCALE, {
  style: "currency",
  currency: "ZAR",
});

export function money(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const numericValue = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(numericValue) ? currency.format(numericValue) : "—";
}

export function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
