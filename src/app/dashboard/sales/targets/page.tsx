import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Section, WorkspaceHeader } from "@/features/dashboard/ui";
import { SalesTargetsWorkspace } from "@/features/sales/SalesTargetsWorkspace";
import { getSalesTargets } from "@/features/sales/queries";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Sales Targets · BluBook" };
export const dynamic = "force-dynamic";

export default async function SalesTargetsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard");

  const data = await getSalesTargets();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Sales"
        title="Targets"
        description="Set the revenue your business is aiming for each quarter. Targets are yours to set and revise, and every phasing chart measures actual revenue against them."
      />

      <Section
        title={`FY${data.fiscalYear}`}
        subtitle="The fiscal year runs 1 March to end February, in four thirteen-week quarters."
      >
        {data.error ? (
          <div role="alert" className="border-l-4 border-clay bg-clay/10 px-5 py-4">
            <p className="font-semibold">Targets could not be loaded.</p>
            <p className="mt-1 text-sm text-ink/60">{data.error}</p>
          </div>
        ) : (
          <SalesTargetsWorkspace data={data} />
        )}
      </Section>
    </div>
  );
}
