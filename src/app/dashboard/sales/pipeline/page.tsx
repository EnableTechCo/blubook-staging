import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Section, WorkspaceHeader } from "@/features/dashboard/ui";
import { SalesPipelineWorkspace } from "@/features/sales/SalesPipelineWorkspace";
import { getSalesPipeline } from "@/features/sales/queries";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Sales Pipeline · BluBook" };
export const dynamic = "force-dynamic";

export default async function SalesPipelinePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard");

  const data = await getSalesPipeline();

  return (
    <div className="mx-auto max-w-[96rem] space-y-8">
      <WorkspaceHeader
        eyebrow="Sales"
        title="Pipeline"
        description="Create and maintain your company’s sales opportunities before a sales order is submitted."
      />

      <Section
        title="Opportunities"
        subtitle={`${data.opportunities.length} active pipeline record${data.opportunities.length === 1 ? "" : "s"}`}
      >
        {data.error ? (
          <div role="alert" className="border-l-4 border-clay bg-clay/10 px-5 py-4">
            <p className="font-semibold">The pipeline could not be loaded.</p>
            <p className="mt-1 text-sm text-ink/60">{data.error}</p>
          </div>
        ) : (
          <SalesPipelineWorkspace
            opportunities={data.opportunities}
            sources={data.sources}
            categories={data.categories}
          />
        )}
      </Section>
    </div>
  );
}
