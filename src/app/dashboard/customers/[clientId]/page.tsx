import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { CustomerEditor, type EditableCustomer } from "@/features/customers/CustomerEditor";
import { StatusLabel } from "@/components/ui/StatusLabel";

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
      <header className="border-b border-ink pb-7">
        <Link href="/dashboard/customers" className="inline-flex min-h-10 items-center font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/60 hover:text-cobalt">← Back to customers</Link>
        <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cobalt">Operations / Customer record</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <h1 className="font-heading text-4xl leading-none sm:text-5xl">{client.business_name}</h1>
          <StatusLabel status={client.status} />
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/65">Maintain this customer&apos;s legal, contact, billing, address and tax information.</p>
      </header>

      {saved ? <p role="status" className="border-x border-b border-cobalt bg-cobalt-wash px-4 py-3 text-sm text-ink">Customer details saved successfully.</p> : null}

      <section className="grid border-x border-b border-ink bg-paper-light sm:grid-cols-3" aria-label="Customer account summary">
        <div className="border-b border-ink p-5 sm:border-b-0 sm:border-r"><p className="font-mono text-[9px] uppercase tracking-[0.09em] text-ink/55">Customer ID</p><p className="mt-2 text-sm font-semibold">{client.external_reference}</p></div>
        <div className="border-b border-ink p-5 sm:border-b-0 sm:border-r"><p className="font-mono text-[9px] uppercase tracking-[0.09em] text-ink/55">Selected service package</p><p className="mt-2 text-sm font-semibold">{activePackage?.name ?? "No active package"}</p>{activePackage ? <div className="mt-2"><StatusLabel status={activePackage.status} /></div> : null}</div>
        <div className="p-5"><p className="font-mono text-[9px] uppercase tracking-[0.09em] text-ink/55">Service commencement</p><p className="mt-2 text-sm font-semibold">{activePackage?.service_commencement_date ?? "Not available"}</p></div>
      </section>

      <CustomerEditor customer={customer} />
    </div>
  );
}
