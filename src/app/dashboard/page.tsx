import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/features/auth/actions";
import { getCurrentProfile } from "@/services/profiles";
import {
  getClientDashboard,
  getProviderDashboard,
  getStaffDashboard,
} from "@/services/dashboard";
import { ClientDashboard } from "@/features/dashboard/ClientDashboard";
import { ProviderDashboard } from "@/features/dashboard/ProviderDashboard";
import { StaffDashboard } from "@/features/dashboard/StaffDashboard";

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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <span className="text-sm text-slate-500">
            Signed in as {profile.full_name ?? profile.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>

        {onboarded ? (
          <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <strong>{onboarded}</strong> has been onboarded — account created, package assembled, and
            initial requests generated.
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
    </div>
  );
}
