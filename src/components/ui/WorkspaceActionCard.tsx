import Link from "next/link";
import type { Route } from "next";

export function WorkspaceActionCard({
  index,
  title,
  description,
  meta,
  href,
  actionLabel = "Open",
}: {
  index: number;
  title: string;
  description: string;
  meta: string;
  href?: Route;
  actionLabel?: string;
}) {
  const content = (
    <>
      <span className="font-mono text-[10px] font-semibold tabular-nums tracking-[0.12em] text-cobalt/70">
        {String(index).padStart(2, "0")}
      </span>
      <h2 className="mt-5 font-heading text-[1.55rem] font-normal leading-tight text-ink">
        {title}
      </h2>
      <span className="mt-3 block text-[13px] leading-6 text-ink/62">{description}</span>
      <span className="mt-auto block pt-7">
        <span className="block border-t border-ink/9 pt-3 text-[9px] font-medium uppercase tracking-[0.12em] text-ink/48">
          {meta}
        </span>
        <span className={`mt-4 flex items-center justify-between text-xs font-semibold ${href ? "text-cobalt-deep" : "text-ink/38"}`}>
          {href ? actionLabel : "Coming soon"}
          {href ? <span aria-hidden="true">→</span> : null}
        </span>
      </span>
    </>
  );

  return (
    <li className="workspace-action-card overflow-hidden">
      {href ? (
        <Link
          href={href}
          className="flex min-h-64 h-full flex-col p-5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-cobalt/30 sm:p-6"
        >
          {content}
        </Link>
      ) : (
        <div className="flex min-h-64 h-full flex-col p-5 opacity-75 sm:p-6" aria-disabled="true">
          {content}
        </div>
      )}
    </li>
  );
}
