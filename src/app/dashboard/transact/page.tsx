import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
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
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Start something"
        title="Transact"
        description="Submit a new transaction. BluBook routes it to the right desk or partner and keeps it visible in your workspace."
      />

      {submitted ? (
        <p className="border-l-[3px] border-teal bg-teal/10 px-4 py-3 text-[13px] leading-6 text-ink">
          Request <strong className="font-mono text-xs">{submitted}</strong> submitted. Track it on
          your dashboard.
        </p>
      ) : null}

      <ul className="grid gap-px border border-ink bg-ink sm:grid-cols-2 lg:grid-cols-3">
        {TRANSACTIONS.map((item) => {
          const inner = (
            <>
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-rust">
                {item.number}
              </span>
              <span className="mt-8 block font-heading text-[1.65rem] font-normal leading-tight text-ink">
                {item.title}
              </span>
              <span className="mt-3 block text-[13px] leading-6 text-ink/60">
                {item.copy}
              </span>
              <span className="mt-6 block border-t border-ink pt-3 text-[9px] uppercase tracking-[0.14em] text-ink/50">
                {item.destination}
              </span>
            </>
          );

          return (
            <li key={item.number}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex h-full flex-col bg-paper p-6 transition-colors hover:bg-cream/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-rust"
                >
                  {inner}
                  <span className="mt-5 text-[12px] font-semibold text-ink">
                    Start <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ) : (
                <div className="flex h-full flex-col bg-paper/70 p-6">
                  {inner}
                  <span className="mt-5 text-[9px] uppercase tracking-[0.14em] text-ink/40">
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
