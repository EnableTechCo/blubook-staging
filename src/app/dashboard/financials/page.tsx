import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Empty, WorkspaceHeader } from "@/features/dashboard/ui";
import { FinancialIntakeForm } from "@/features/finance/FinancialIntakeForm";
import { getFinancialIntake } from "@/features/finance/queries";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Client Financials · BluBook" };
export const dynamic = "force-dynamic";

export default async function FinancialsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "service_provider") redirect("/dashboard");

  const data = await getFinancialIntake();

  return (
    <div className="mx-auto max-w-[80rem] space-y-8">
      <WorkspaceHeader
        eyebrow="Finance"
        title="Client Financials"
        description="File the weekly figures behind a customer's finance dashboard. Only raw inputs are recorded; every ratio is worked out from them."
      />

      {data.error ? (
        <div role="alert" className="border-l-4 border-clay bg-clay/10 px-5 py-4">
          <p className="font-semibold">The customer list could not be loaded.</p>
          <p className="mt-1 text-sm text-ink/60">{data.error}</p>
        </div>
      ) : data.clients.length === 0 ? (
        <Empty>
          Your practice is not responsible for any customer&rsquo;s financial reporting yet. Your
          BluBook contact can add you to the work group that carries it.
        </Empty>
      ) : (
        <FinancialIntakeForm data={data} />
      )}
    </div>
  );
}
