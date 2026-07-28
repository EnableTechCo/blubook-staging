import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Transact · BluBook" };
export const dynamic = "force-dynamic";

// The three client-initiated transactions. Sales orders route to a sales rep and
// tender applications to sales admin once those flows are built; only service
// requests are live today, so the rest are marked as such rather than linked.
const TRANSACTIONS: {
  number: string;
  title: string;
  copy: string;
  destination: string;
  href?: Route;
}[] = [
  {
    number: "01",
    title: "Submit Service Request",
    copy: "Raise work against a service — the request is created, tracked, and routed for you.",
    destination: "Goes to a matching Service Partner",
    href: "/dashboard/transact/service-request",
  },
  {
    number: "02",
    title: "Submit Sales Order",
    copy: "Raise a purchase order for goods against your account.",
    destination: "Goes to your sales rep",
  },
  {
    number: "03",
    title: "Submit Tender Application",
    copy: "Submit a tender application for BluBook to prepare and lodge.",
    destination: "Goes to sales admin",
  },
];

export default async function TransactPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  // Transacting is a client action; other roles have no entry point here.
  if (profile.user_type !== "client") redirect("/dashboard");

  const { submitted } = await searchParams;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
          Start something
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-[-0.03em] text-ink">
          Transact
        </h1>
        <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-slate-600">
          Submit a new transaction. BluBook routes it to the right desk or partner and keeps it
          visible in your workspace.
        </p>
      </header>

      {submitted ? (
        <p className="mb-6 border-l-4 border-teal bg-emerald-50 px-4 py-3 font-body text-sm leading-6 text-ink">
          Request <strong className="font-mono text-xs">{submitted}</strong> submitted. Track it on
          your dashboard.
        </p>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRANSACTIONS.map((item) => {
          const inner = (
            <>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-cobalt">
                {item.number}
              </span>
              <span className="mt-3 block font-heading text-xl font-medium tracking-[-0.02em] text-ink">
                {item.title}
              </span>
              <span className="mt-2 block font-body text-sm leading-6 text-slate-600">
                {item.copy}
              </span>
              <span className="mt-4 block border-t border-ink/15 pt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-cobalt">
                {item.destination}
              </span>
            </>
          );

          return (
            <li key={item.number}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex h-full flex-col border border-ink/40 border-t-ink bg-paper-light/95 p-5 transition-colors hover:border-cobalt hover:bg-cobalt-wash/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun"
                >
                  {inner}
                  <span className="mt-4 font-body text-sm font-semibold text-ink">
                    Start <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ) : (
                <div className="flex h-full flex-col border border-dashed border-ink/25 bg-paper/60 p-5">
                  {inner}
                  <span className="mt-4 font-mono text-[9px] uppercase tracking-[0.1em] text-slate-500">
                    Coming soon
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
