import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Sales Bookings · BluBook" };

export default async function SalesBookingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Sales"
        title="Bookings"
        description="Completed purchase-order opportunities will appear here once invoice and booking delivery is enabled."
      />
      <section className="border border-ink bg-paper-light px-6 py-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cobalt">Coming next</p>
        <h2 className="mt-3 font-heading text-[2rem] font-normal">Bookings are not active yet</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">
          Your Pipeline is available now. Bookings will activate after purchase orders can be linked to opportunities and completed with an invoice.
        </p>
      </section>
    </div>
  );
}
