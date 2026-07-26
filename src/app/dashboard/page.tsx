import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClientDashboard } from "@/features/dashboard/ClientDashboard";
import { ProviderDashboard } from "@/features/dashboard/ProviderDashboard";
import { StaffDashboard } from "@/features/dashboard/StaffDashboard";
import {
  getClientDashboard,
  getProviderDashboard,
  getStaffDashboard,
} from "@/services/dashboard";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Dashboard · BluBook" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarded?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { onboarded } = await searchParams;

  return (
    <div className="mx-auto max-w-[90rem]">
        {onboarded ? (
          <div className="mb-6 border border-teal bg-emerald-50 px-4 py-3 text-sm text-teal">
            <strong>{onboarded}</strong> has been onboarded — account created,
            package assembled, and initial requests generated.
          </div>
        ) : null}

        {profile.user_type === "client" ? (
          <ClientDashboard data={await getClientDashboard()} />
        ) : profile.user_type === "service_provider" ? (
          <ProviderDashboard data={await getProviderDashboard()} />
        ) : (
          <StaffDashboard data={await getStaffDashboard()} />
        )}
    </div>
  );
}
