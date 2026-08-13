import type { ReactNode } from "react";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { SAST, SAST_LOCALE } from "@/lib/time";

const currency = new Intl.NumberFormat(SAST_LOCALE, {
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
  return new Date(iso).toLocaleDateString(SAST_LOCALE, {
    timeZone: SAST,
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

export function WorkspaceHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="grid gap-6 border-b border-ink/10 pb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div>
        <p className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.18em] text-rust">
          <span className="h-px w-7 bg-rust" aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 className="mt-3 font-heading text-[clamp(2.25rem,4vw,3.25rem)] font-normal leading-[0.98] tracking-[-0.035em] text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-[13px] leading-6 text-ink/60">{description}</p>
        ) : null}
      </div>
      {aside ? <div className="lg:pb-1">{aside}</div> : null}
    </header>
  );
}

export function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/78 shadow-surface">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/8 bg-paper-light/55 px-5 py-5 sm:px-6">
        <div>
          <h2 className="font-heading text-[1.55rem] font-normal leading-none tracking-[-0.02em] text-ink">
            {title}
          </h2>
          {subtitle ? <p className="mt-2 text-xs leading-5 text-ink/55">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
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
    <div className="min-h-28 border-b border-r border-ink/8 bg-paper-light/70 p-4">
      <div
        className={`font-heading text-[2.5rem] font-normal leading-none ${
          tone === "amber" ? "text-rust" : "text-ink"
        }`}
      >
        {value}
      </div>
      <div className="mt-3 text-[10px] font-medium uppercase tracking-[0.13em] text-ink/55">
        {label}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-cobalt/10 bg-cobalt-wash/65 px-4 py-3 text-[13px] leading-5 text-ink/60">
      {children}
    </p>
  );
}
