import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Empty, Section, WorkspaceHeader } from "@/features/dashboard/ui";
import { TransactionSubmissionForm } from "@/features/transact/TransactionSubmissionForm";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Purchase Order Submission · BluBook" };
export const dynamic = "force-dynamic";

// A purchase order is spend the business is committing to, so it is a plain
// routed submission — no pipeline opportunity, no invoice coming back, no
// booking. The sales order next door is the one that carries all of that.
export default async function PurchaseOrderSubmissionPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard/transact");

  const { data: service } = await (await createClient())
    .from("services")
    .select("id")
    .eq("slug", "purchase-order-submission")
    .eq("active", true)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <WorkspaceHeader
        eyebrow="Transact"
        title="Create Purchase Order"
        description="Share a purchase order you are placing, with the documents that support it."
      />
      <Section
        title="Purchase order details"
        subtitle="Your submission becomes a tracked service request after the documents are verified."
      >
        {service ? (
          <TransactionSubmissionForm kind="purchase_order" />
        ) : (
          <Empty>
            Purchase Order Submission has not been configured by BluBook operations yet.
          </Empty>
        )}
      </Section>
    </div>
  );
}
