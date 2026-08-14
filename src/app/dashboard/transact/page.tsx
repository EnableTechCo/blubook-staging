import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Transact · BluBook" };
export const dynamic = "force-dynamic";

// The client-initiated transactions. Each becomes a routed, tracked service
// request while keeping its purpose clear to clients and partners. The heading
// stays "Submissions"; the actions themselves are what a client creates.
const TRANSACTIONS: {
  title: string;
  copy: string;
  destination: string;
  href?: Route;
}[] = [
  {
    title: "Create Quotation",
    copy: "Price a quotation from your product list and print it onto your letterhead.",
    destination: "Yours to send — a copy is filed in your archive",
    href: "/dashboard/transact/quotation",
  },
  {
    title: "Create Service Request",
    copy: "Raise work against a service — the request is created, tracked, and routed for you.",
    destination: "Goes to a matching Service Partner",
    href: "/dashboard/transact/service-request",
  },
  {
    title: "Create Sales Order",
    copy: "Raise a sales order against a pipeline opportunity, for a partner to fulfil and invoice.",
    destination: "Goes to the Sales Operations desk",
    href: "/dashboard/transact/sales-order",
  },
  {
    title: "Create Purchase Order",
    copy: "Share a purchase order you are placing, with its supporting documents.",
    destination: "Goes to the Sales Operations desk",
    href: "/dashboard/transact/purchase-order",
  },
  {
    title: "Create Tender",
    copy: "Share a tender pack for a partner to review, prepare, and complete.",
    destination: "Goes to a matching Tender Partner",
    href: "/dashboard/transact/tender",
  },
  {
    title: "Create RFFA",
    copy: "Share a request for further award information for a partner to prepare and issue.",
    destination: "Goes to a matching Tender Partner",
    href: "/dashboard/transact/rffa",
  },
  {
    title: "Create RFQ",
    copy: "Share a request for quotation for a partner to prepare and issue.",
    destination: "Goes to a matching Tender Partner",
    href: "/dashboard/transact/rfq",
  },
];

export default async function TransactPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  // Every submission below is client-only, and the reporting views a partner
  // used to reach from here now live under Reports.
  if (profile.user_type !== "client") redirect("/dashboard");

  const { submitted } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Transact"
        title="Submissions"
        description="Submit a new transaction. BluBook routes it to the right desk or partner and keeps it visible in your workspace."
      />

      {submitted ? (
        <p className="border-l-[3px] border-teal bg-teal/10 px-4 py-3 text-[13px] leading-6 text-ink">
          Request <strong className="font-mono text-xs">{submitted}</strong> submitted. Track it on
          your dashboard.
        </p>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRANSACTIONS.map((item) => {
          const inner = (
            <>
              <span className="block font-heading text-[1.65rem] font-normal leading-tight text-ink">
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
            <li key={item.title} className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/75 shadow-surface">
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex h-full flex-col bg-paper-light/70 p-6 transition-[background-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-cobalt-wash/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cobalt"
                >
                  {inner}
                  <span className="mt-5 text-[12px] font-semibold text-ink">
                    Start <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ) : (
                <div className="flex h-full flex-col bg-paper-light/55 p-6">
                  {inner}
                  <span className="mt-5 text-[9px] uppercase tracking-[0.14em] text-ink/40">
                    Unavailable
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
