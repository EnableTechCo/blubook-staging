import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { Empty, WorkspaceHeader } from "@/features/dashboard/ui";
import { getFinancialOverview } from "@/features/finance/queries";
import { formatDate } from "@/features/dashboard/ui";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Client Financials · BluBook" };
export const dynamic = "force-dynamic";

// The list layer: who is outstanding this week, at a glance. A partner
// responsible for eighteen accounts needs to see the gaps, not eighteen forms.
export default async function FinancialsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "service_provider") redirect("/dashboard");

  const data = await getFinancialOverview();
  const filed = data.rows.filter((row) => row.submitted_at !== null).length;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Finance"
        title="Client Financials"
        description="File the weekly figures behind each customer's finance dashboard. Every submission carries a supporting document."
      />

      {data.error ? (
        <div role="alert" className="border-l-4 border-clay bg-clay/10 px-5 py-4">
          <p className="font-semibold">The customer list could not be loaded.</p>
          <p className="mt-1 text-sm text-ink/60">{data.error}</p>
        </div>
      ) : data.rows.length === 0 ? (
        <Empty>
          Your practice is not responsible for any customer&rsquo;s financial reporting. Your
          BluBook contact can tell you more.
        </Empty>
      ) : (
        <>
          <div className="border-y border-ink bg-cream/40 px-5 py-4">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-cobalt">
              Q{data.fiscalQuarter} week {data.fiscalWeek} · FY{data.fiscalYear}
            </p>
            <p className="mt-2 font-heading text-3xl leading-none text-ink">
              {filed} of {data.rows.length} filed
            </p>
            <p className="mt-2 text-xs leading-5 text-ink/55">
              {filed === data.rows.length
                ? "Every customer is up to date for this week."
                : `${data.rows.length - filed} still to file for this week.`}
            </p>
          </div>

          <ul className="grid border-l border-t border-ink">
            {data.rows.map((row) => {
              const submitted = row.submitted_at !== null;
              return (
                <li key={row.client_id} className="border-b border-r border-ink">
                  <Link
                    href={`/dashboard/financials/${row.client_id}` as Route}
                    className="flex flex-wrap items-center justify-between gap-4 bg-paper px-5 py-4 transition-colors hover:bg-cream/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-rust"
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-[11px] text-rust">
                        {row.external_reference ?? "Customer"}
                      </span>
                      {/* Only ever present where the partner is entitled to it. */}
                      {row.business_name ? (
                        <span className="mt-1 block text-sm font-medium text-ink">
                          {row.business_name}
                        </span>
                      ) : null}
                      {submitted && row.evidence_title ? (
                        <span className="mt-1 block text-[11px] text-ink/50">
                          Evidence: {row.evidence_title}
                        </span>
                      ) : null}
                    </span>

                    <span className="flex items-center gap-4">
                      <span
                        className={`font-mono text-[9px] font-semibold uppercase tracking-[0.12em] ${
                          submitted ? "text-teal" : "text-clay"
                        }`}
                      >
                        {submitted ? `Filed ${formatDate(row.submitted_at!)}` : "Not filed"}
                      </span>
                      <span className="text-[12px] font-semibold text-ink" aria-hidden="true">
                        →
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
