import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { WorkspaceActionCard } from "@/components/ui/WorkspaceActionCard";
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
    title: "Create Letterhead",
    copy: "Your paper, and the banking details it carries. Quotations and notices are printed onto it.",
    destination: "Yours alone — no BluBook staff member can read it",
    href: "/dashboard/transact/letterhead",
  },
  {
    title: "Create Quotation",
    copy: "Price a quotation from your product list and print it onto your letterhead.",
    destination: "Yours to send — a copy is filed in your archive",
    href: "/dashboard/transact/quotation",
  },
  {
    title: "Task Board",
    copy: "Keep your own list of what needs doing, with reminders that reach your notifications.",
    destination: "Yours alone — no BluBook staff member can read it",
    href: "/dashboard/transact/task-board",
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
        {TRANSACTIONS.map((item, index) => (
          <WorkspaceActionCard
            key={item.title}
            index={index + 1}
            title={item.title}
            description={item.copy}
            meta={item.destination}
            href={item.href}
            actionLabel="Start"
          />
        ))}
      </ul>
    </div>
  );
}
