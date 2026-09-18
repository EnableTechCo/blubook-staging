import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClientDashboard } from "@/features/dashboard/ClientDashboard";
import { ProviderDashboard } from "@/features/dashboard/ProviderDashboard";
import { StaffDashboard } from "@/features/dashboard/StaffDashboard";
import { getClientDashboard, getProviderDashboard, getStaffDashboard } from "@/services/dashboards";
import { getSalesPerformance } from "@/features/sales/queries";
import { getClientFinancials } from "@/features/finance/queries";
import { getComplianceRatio } from "@/features/compliance/queries";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Dashboard · BluBook" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ accountCreated?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { accountCreated } = await searchParams;

  // Awaited together: written inline as props these ran one after another,
  // and each is a round trip to the database region.
  const clientPanels =
    profile.user_type === "client"
      ? await Promise.all([
          getClientDashboard(),
          getSalesPerformance(),
          getClientFinancials(),
          getComplianceRatio(),
        ])
      : null;

  return (
    <div className="mx-auto max-w-[90rem]">
        {profile.user_type === "client" && accountCreated === "1" ? (
          <div className="mb-6 border border-teal bg-emerald-50 px-4 py-3 text-sm text-teal">
            <strong>Your account is ready.</strong> Your service package, compliance checklist,
            and initial requests are available in this workspace.
          </div>
        ) : null}

        {clientPanels ? (
          <ClientDashboard
            data={clientPanels[0]}
            performance={clientPanels[1]}
            financials={clientPanels[2]}
            compliance={clientPanels[3]}
          />
        ) : profile.user_type === "service_provider" ? (
          <ProviderDashboard data={await getProviderDashboard()} />
        ) : (
          <StaffDashboard data={await getStaffDashboard()} />
        )}
    </div>
  );
}
