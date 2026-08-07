import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Empty, Section, WorkspaceHeader } from "@/features/dashboard/ui";
import { TransactionSubmissionForm } from "@/features/transact/TransactionSubmissionForm";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Create RFQ · BluBook" };
export const dynamic = "force-dynamic";

export default async function RFQPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard/transact");

  const { data: service } = await (await createClient())
    .from("services")
    .select("id")
    .eq("slug", "rfq-submission")
    .eq("active", true)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <WorkspaceHeader
        eyebrow="Transact"
        title="Create RFQ"
        description="Share a request for quotation with the matching Tender Partner to prepare and issue."
      />
      <Section
        title="RFQ details"
        subtitle="Your submission becomes a tracked service request after the documents are verified."
      >
        {service ? (
          <TransactionSubmissionForm kind="rfq" />
        ) : (
          <Empty>RFQ has not been configured by BluBook operations yet.</Empty>
        )}
      </Section>
    </div>
  );
}
