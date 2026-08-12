import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { FinancialIntakeForm } from "@/features/finance/FinancialIntakeForm";
import { getFinancialIntake, getSubmissionClient } from "@/features/finance/queries";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "File Financials · BluBook" };
export const dynamic = "force-dynamic";

export default async function ClientFinancialsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "service_provider") redirect("/dashboard");

  const { clientId } = await params;
  // The lookup runs through the same gate the write does, so a partner cannot
  // reach a customer's form by guessing the URL.
  const client = await getSubmissionClient(clientId);
  if (!client) notFound();

  const period = await getFinancialIntake();

  return (
    <div className="mx-auto max-w-[80rem] space-y-8">
      <WorkspaceHeader
        eyebrow="Finance"
        title={client.business_name ?? client.external_reference ?? "Customer"}
        description="Record the week's figures and attach the document they come from. The document is filed to this customer's archive and kept in your own library."
      />

      <Link
        href="/dashboard/financials"
        className="inline-block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-cobalt hover:text-cobalt-deep"
      >
        ← All customers
      </Link>

      <FinancialIntakeForm
        client={client}
        fiscalYear={period.fiscalYear}
        fiscalQuarter={period.fiscalQuarter}
        fiscalWeek={period.fiscalWeek}
      />
    </div>
  );
}
