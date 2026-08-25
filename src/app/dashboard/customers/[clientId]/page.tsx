import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { requireStaffRole } from "@/services/staffRole";
import { CustomerEditor, type EditableCustomer } from "@/features/customers/CustomerEditor";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { WorkspaceHeader } from "@/features/dashboard/ui";

export const metadata: Metadata = { title: "Customer record · BluBook" };
export const dynamic = "force-dynamic";

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "staff") redirect("/dashboard");

  // Every staff role reads the customer record; only operations edits it.
  const canEdit = (await requireStaffRole("operations")) === null;

  const { clientId } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle();
  if (!client) notFound();

  const [primaryContactResult, packageResult] = await Promise.all([
    client.primary_profile_id
      ? supabase.from("profiles").select("full_name,email").eq("id", client.primary_profile_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("client_packages")
      .select("name,status,service_commencement_date,created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false }),
  ]);
  const primaryContact = primaryContactResult.data;
  const activePackage = packageResult.data?.find((item) => item.status === "active") ?? null;
  const customer: EditableCustomer = {
    ...client,
    primaryContactName: primaryContact?.full_name ?? "",
    primaryContactEmail: primaryContact?.email ?? "",
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/dashboard/customers" className="inline-flex min-h-10 items-center font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/55 hover:text-cobalt">← Back to customers</Link>
      <div className="mt-3">
        <WorkspaceHeader
          eyebrow="Operations / Customer record"
          title={client.business_name}
          description="Maintain this customer's legal, contact, billing, address and tax information."
          aside={<StatusLabel status={client.status} />}
        />
      </div>

      {saved ? <p role="status" className="border-x border-b border-cobalt bg-cobalt-wash px-4 py-3 text-sm text-ink">Customer details saved successfully.</p> : null}

      <section className="workspace-panel mt-7 grid sm:grid-cols-3" aria-label="Customer account summary">
        <div className="border-b border-ink p-5 sm:border-b-0 sm:border-r"><p className="font-mono text-[9px] uppercase tracking-[0.09em] text-ink/55">Customer ID</p><p className="mt-2 text-sm font-semibold">{client.external_reference}</p></div>
        <div className="border-b border-ink p-5 sm:border-b-0 sm:border-r"><p className="font-mono text-[9px] uppercase tracking-[0.09em] text-ink/55">Selected service package</p><p className="mt-2 text-sm font-semibold">{activePackage?.name ?? "No active package"}</p>{activePackage ? <div className="mt-2"><StatusLabel status={activePackage.status} /></div> : null}</div>
        <div className="p-5"><p className="font-mono text-[9px] uppercase tracking-[0.09em] text-ink/55">Service commencement</p><p className="mt-2 text-sm font-semibold">{activePackage?.service_commencement_date ?? "Not available"}</p></div>
      </section>

      <CustomerEditor customer={customer} canEdit={canEdit} />
    </div>
  );
}
