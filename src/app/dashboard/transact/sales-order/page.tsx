import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Empty, Section, WorkspaceHeader } from "@/features/dashboard/ui";
import { TransactionSubmissionForm } from "@/features/transact/TransactionSubmissionForm";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { getSalesPipeline } from "@/features/sales/queries";

export const metadata: Metadata = { title: "Sales Order Submission · BluBook" };
export const dynamic = "force-dynamic";

export default async function SalesOrderSubmissionPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunityId?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard/transact");
  const [{ data: service }, pipeline, query] = await Promise.all([
    (await createClient())
    .from("services")
    .select("id")
    .eq("slug", "sales-order-submission")
    .eq("active", true)
    .maybeSingle(),
    getSalesPipeline(),
    searchParams,
  ]);
  const eligible = pipeline.opportunities.filter(
    (opportunity) => !opportunity.salesOrder && !opportunity.booked_at,
  );
  const lockedOpportunityId = eligible.some((item) => item.id === query.opportunityId)
    ? query.opportunityId
    : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <WorkspaceHeader
        eyebrow="Transact"
        title="Submit Sales Order"
        description="Share a sales order and its supporting documents with the matching Sales Partner."
      />
      <Section
        title="Sales order details"
        subtitle="Your submission becomes a tracked service request after the documents are verified."
      >
        {service ? (
          <TransactionSubmissionForm
            kind="sales_order"
            opportunities={eligible}
            sources={pipeline.sources}
            categories={pipeline.categories.filter((category) => category.code !== "booked")}
            lockedOpportunityId={lockedOpportunityId}
          />
        ) : (
          <Empty>
            Sales Order Submission has not been configured by BluBook operations yet.
          </Empty>
        )}
      </Section>
    </div>
  );
}
