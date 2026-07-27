import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentProfile } from "@/services/profiles";
import { getUnreadNotificationCount } from "@/services/dashboard";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const unreadNotifications = await getUnreadNotificationCount();

  return (
    <AppShell profile={profile} unreadNotifications={unreadNotifications}>
      {children}
    </AppShell>
  );
}
