import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Empty, WorkspaceHeader } from "@/features/dashboard/ui";
import { getCurrentProfile } from "@/services/profiles";
import { SERVICE_SLUGS } from "@/features/transact/kinds";
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
    .select("id,name,description,default_turnaround_days,service_groups(name)")
    .eq("active", true)
    // Each transaction kind has its own form collecting fields a plain service
    // request never asks for, so raising one from here would bypass them.
    .not("slug", "in", `(${Object.values(SERVICE_SLUGS).join(",")})`)
    .order("name")
    .returns<ServiceOption[]>();

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <Link
        href="/dashboard/transact"
        className="inline-block border-b border-ink text-[12px] font-medium text-ink hover:border-rust hover:text-rust"
      >
        ← Submissions
      </Link>

      <WorkspaceHeader
        eyebrow="Service request template"
        title="Submit a service request"
        description="Tell BluBook what the business needs. The request enters the existing matching and tracking workflow."
      />

      <div className="border-y border-ink bg-paper p-5 sm:p-7">
        {services && services.length > 0 ? (
          <ServiceRequestForm services={services} />
        ) : (
          <Empty>
            No services are available yet. Please contact your BluBook representative.
          </Empty>
        )}
      </div>
    </div>
  );
}
