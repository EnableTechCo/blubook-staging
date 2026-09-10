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
  searchParams: Promise<{ onboarded?: string; email?: string; emailReason?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { onboarded, email, emailReason } = await searchParams;

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
        {onboarded ? (
          <div className="mb-6 border border-teal bg-emerald-50 px-4 py-3 text-sm text-teal">
            <strong>{onboarded}</strong> has been onboarded — account created,
            package assembled, and initial requests generated.
            {email === "sent" ? " Sign-in details have been emailed to them." : null}
          </div>
        ) : null}

        {/* The account is live either way, but nobody can sign in until the
            password reaches them, so this cannot be a quiet failure. */}
        {onboarded && email && email !== "sent" ? (
          <div role="alert" className="mb-6 border border-clay bg-clay/10 px-4 py-3 text-sm text-ink">
            <strong>Sign-in details were not emailed.</strong> Share the temporary password with
            the client yourself.
            {emailReason ? <span className="block mt-1 text-ink/70">{emailReason}</span> : null}
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
