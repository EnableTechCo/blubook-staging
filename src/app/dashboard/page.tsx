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

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

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
