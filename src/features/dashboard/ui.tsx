import type { ReactNode } from "react";
import { StatusLabel } from "@/components/ui/StatusLabel";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

export function money(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const numericValue = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(numericValue) ? currency.format(numericValue) : "—";
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function Badge({ status }: { status: string }) {
  return <StatusLabel status={status} />;
}

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-ink/40 bg-paper-light/95 p-5 shadow-none">
      <div className="mb-4 border-b border-ink/15 pb-3">
        <h2 className="font-heading text-xl font-medium tracking-[-0.02em] text-ink">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-xs text-slate-600">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "amber";
}) {
  return (
    <div className="min-h-28 border border-ink/20 border-t-ink bg-paper-light/60 p-4">
      <div
        className={`font-heading text-3xl font-medium ${
          tone === "amber" ? "text-clay" : "text-ink"
        }`}
      >
        {value}
      </div>
      <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-cobalt">
        {label}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="border-l-[3px] border-sun bg-paper px-3 py-2 text-sm text-slate-600">
      {children}
    </p>
  );
}
