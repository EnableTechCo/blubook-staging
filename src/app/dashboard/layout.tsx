import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentProfile } from "@/services/profiles";
import { getUnreadNotificationCount } from "@/services/dashboard";
import { canSubmitFinancials } from "@/features/finance/queries";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [unreadNotifications, financialsCapable] = await Promise.all([
    getUnreadNotificationCount(),
    profile.user_type === "service_provider" ? canSubmitFinancials() : Promise.resolve(false),
  ]);

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      canSubmitFinancials={financialsCapable}
    >
      {children}
    </AppShell>
  );
}
