import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Empty, Section, WorkspaceHeader } from "@/features/dashboard/ui";
import { TransactionSubmissionForm } from "@/features/transact/TransactionSubmissionForm";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Create RFFA · BluBook" };
export const dynamic = "force-dynamic";

export default async function RFFAPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard/transact");

  const { data: service } = await (await createClient())
    .from("services")
    .select("id")
    .eq("slug", "rffa-submission")
    .eq("active", true)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <WorkspaceHeader
        eyebrow="Transact"
        title="Create RFFA"
        description="Share a request for further award information with the matching Tender Partner to prepare and issue."
      />
      <Section
        title="RFFA details"
        subtitle="Your submission becomes a tracked service request after the documents are verified."
      >
        {service ? (
          <TransactionSubmissionForm kind="rffa" />
        ) : (
          <Empty>RFFA has not been configured by BluBook operations yet.</Empty>
        )}
      </Section>
    </div>
  );
}
