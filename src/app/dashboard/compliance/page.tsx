import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { ComplianceSettingRow } from "@/features/compliance/ComplianceSettingsForm";
import { getComplianceSettings } from "@/features/compliance/queries";
import { OverdueSweepButton } from "@/features/compliance/OverdueSweepButton";
import { getCurrentProfile } from "@/services/profiles";
import { requireStaffRoute } from "@/services/staffRole";

export const metadata: Metadata = { title: "Compliance settings · BluBook" };
export const dynamic = "force-dynamic";

export default async function ComplianceSettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (await requireStaffRoute("/dashboard/compliance")) redirect("/dashboard");

  const settings = await getComplianceSettings();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Operations / Compliance"
        title="Compliance settings"
        description="What each finance metric is worth, and what counts as meeting it. Every client's Weighted Compliance Ratio is scored against these."
      />

      <p className="border-l-[3px] border-sun bg-cream/45 px-4 py-3 text-[13px] leading-6 text-ink/70">
        A metric a client has not reported is left out of their ratio rather than counted against
        them, so a partner who has not filed cannot drag a score down.
      </p>

      <section className="border-t border-ink bg-paper px-5 py-5">
        <h2 className="font-heading text-[1.35rem] leading-none text-ink">Past-due requests</h2>
        <p className="mt-2 mb-4 text-xs leading-5 text-ink/55">
          Notifies clients about requests that have passed their due date. These are deliberately
          not urgent, so they do not ring the bell.
        </p>
        <OverdueSweepButton />
      </section>

      <ul className="grid border-l border-t border-ink">
        {settings.map((setting) => (
          <ComplianceSettingRow key={setting.metric_key} setting={setting} />
        ))}
      </ul>
    </div>
  );
}
