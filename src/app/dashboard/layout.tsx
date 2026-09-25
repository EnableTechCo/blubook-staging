import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/features/auth/actions";
import { AppShell } from "@/components/layout/AppShell";
import { AwaitingApproval } from "@/features/onboarding/AwaitingApproval";
import { getCurrentProfile } from "@/services/profiles";
import { getUnreadNotificationCount } from "@/services/notifications";
import { currentClientStatus } from "@/services/clientAccess";
import { canSubmitFinancials } from "@/features/finance/queries";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [unreadNotifications, financialsCapable, clientStatus] = await Promise.all([
    getUnreadNotificationCount(),
    profile.user_type === "service_provider" ? canSubmitFinancials() : Promise.resolve(false),
    profile.user_type === "client" ? currentClientStatus() : Promise.resolve(null),
  ]);

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      canSubmitFinancials={financialsCapable}
      signOut={signOut}
    >
      {/* A client whose onboarding awaits approval sees only the waiting
          screen, on every dashboard route. Routing refuses a client that is
          not active in any case; this keeps the workspace from offering
          actions that could only fail. */}
      {clientStatus === "pending" ? <AwaitingApproval name={profile.full_name} /> : children}
    </AppShell>
  );
}
