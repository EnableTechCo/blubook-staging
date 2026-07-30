import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { buttonStyles } from "@/components/ui/Button";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Transact · BluBook" };
export const dynamic = "force-dynamic";

// The three client-initiated transactions. Each becomes a routed, tracked
// service request while keeping its purpose clear to clients and partners.
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
    title: "Submit Purchase Order",
    copy: "Share a purchase order and supporting files for partner review.",
    destination: "Goes to a matching Sales Partner",
    href: "/dashboard/transact/purchase-order",
  },
  {
    number: "03",
    title: "Submit Tender",
    copy: "Share a tender pack for a partner to review, prepare, and complete.",
    destination: "Goes to a matching Tender Partner",
    href: "/dashboard/transact/tender",
  },
];

const TRANSACT_VIEWS: Array<{
  href: Route;
  label: string;
}> = [
  {
    href: "/dashboard/transact/requests",
    label: "View Service Request Tracker",
  },
  {
    href: "/dashboard/transact/performance",
    label: "View Performance Dashboards",
  },
];

export default async function TransactPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type === "staff") redirect("/dashboard");

  const { submitted } = await searchParams;
  const isClient = profile.user_type === "client";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Transact"
        title={isClient ? "Submissions" : "Transact"}
        description={
          isClient
            ? "Submit a new transaction. BluBook routes it to the right desk or partner and keeps it visible in your workspace."
            : "Open your assigned service requests or review delivery performance from one workspace."
        }
      />

      {isClient && submitted ? (
        <p className="border-l-[3px] border-teal bg-teal/10 px-4 py-3 text-[13px] leading-6 text-ink">
          Request <strong className="font-mono text-xs">{submitted}</strong> submitted. Track it on
          your dashboard.
        </p>
      ) : null}

      {isClient ? (
        <ul className="grid border-l border-t border-ink sm:grid-cols-2 lg:grid-cols-3">
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
              <li key={item.number} className="border-b border-r border-ink">
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
                      Unavailable
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      <nav aria-label="Transact views" className="grid gap-3 border-t border-ink pt-6">
        {TRANSACT_VIEWS.map((view, index) => (
          <Link
            key={view.href}
            href={view.href}
            className={buttonStyles({
              variant: index === 0 ? "primary" : "secondary",
              fullWidth: true,
            })}
          >
            <span>{view.label}</span>
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
