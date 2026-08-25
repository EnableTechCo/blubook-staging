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
  eyebrow?: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="workspace-page-header">
      <div>
        {eyebrow ? (
          <p className="workspace-eyebrow">{eyebrow}</p>
        ) : null}
        <h1 className={`workspace-page-title ${eyebrow ? "" : "!mt-0"}`}>{title}</h1>
        {description ? (
          <p className="workspace-page-description">{description}</p>
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
    <section className="workspace-panel">
      <div className="workspace-panel-header">
        <div>
          <h2 className="workspace-panel-title">{title}</h2>
          {subtitle ? <p className="workspace-panel-subtitle">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="workspace-panel-body">{children}</div>
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
    <div className="workspace-metric-cell border-b border-r">
      <div
        className={`workspace-metric-value ${
          tone === "amber" ? "text-rust" : "text-ink"
        }`}
        data-workspace-number
      >
        {value}
      </div>
      <div className="workspace-metric-label">{label}</div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="workspace-empty px-4 py-3 text-[13px] leading-5">
      {children}
    </p>
  );
}
