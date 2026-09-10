import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/components/ui/Workspace";
import { SalesBookingsWorkspace } from "@/features/sales/SalesBookingsWorkspace";
import { getSalesBookings } from "@/features/sales/queries";
import { getCurrentProfile } from "@/services/profiles";
import { requireClient } from "@/services/clientAccess";

export const metadata: Metadata = { title: "Sales Bookings · BluBook" };

export default async function SalesBookingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (await requireClient()) redirect("/dashboard");
  const data = await getSalesBookings();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Sales"
        title="Bookings"
        description="Track completed sales-order opportunities, expected revenue, payment status, and fiscal period."
      />
      {data.error ? (
        <p role="alert" className="border-l-4 border-clay bg-clay/10 px-5 py-4 text-sm text-ink">{data.error}</p>
      ) : (
        <SalesBookingsWorkspace bookings={data.bookings} />
      )}
    </div>
  );
}
