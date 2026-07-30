import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Empty, Section, WorkspaceHeader } from "@/features/dashboard/ui";
import { TransactionSubmissionForm } from "@/features/transact/TransactionSubmissionForm";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Tender Submission · BluBook" };
export const dynamic = "force-dynamic";

export default async function TenderSubmissionPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard/transact");
  const { data: service } = await (await createClient())
    .from("services")
    .select("id")
    .eq("slug", "tender-submission")
    .eq("active", true)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <WorkspaceHeader
        eyebrow="Transact"
        title="Submit Tender"
        description="Share a tender pack with the matching Tender Partner for review and completion."
      />
      <Section
        title="Tender details"
        subtitle="Your submission becomes a tracked service request after the documents are verified."
      >
        {service ? (
          <TransactionSubmissionForm kind="tender_submission" />
        ) : (
          <Empty>Tender Submission has not been configured by BluBook operations yet.</Empty>
        )}
      </Section>
    </div>
  );
}
