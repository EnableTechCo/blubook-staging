import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import {
  ServiceRequestForm,
  type ServiceOption,
} from "@/features/transact/ServiceRequestForm";

export const metadata: Metadata = { title: "Submit a service request · BluBook" };
export const dynamic = "force-dynamic";

export default async function ServiceRequestPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard");

  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id,name,description,default_turnaround_days")
    .eq("active", true)
    .order("name")
    .returns<ServiceOption[]>();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/transact"
        className="font-body text-sm text-slate-600 hover:text-cobalt"
      >
        ← Transact
      </Link>

      <header className="mt-4 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
          Service request template
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-[-0.03em] text-ink">
          Submit a service request
        </h1>
      </header>

      <div className="border border-ink/40 bg-paper-light/95 p-6">
        {services && services.length > 0 ? (
          <ServiceRequestForm services={services} />
        ) : (
          <p className="border-l-[3px] border-sun bg-paper px-4 py-3 font-body text-sm text-slate-600">
            No services are available yet. Please contact your BluBook representative.
          </p>
        )}
      </div>
    </div>
  );
}
