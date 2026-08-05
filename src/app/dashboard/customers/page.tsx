import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";
import { getCustomers } from "@/features/customers/queries";
import { Button, buttonStyles } from "@/components/ui/Button";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { SAST, SAST_LOCALE } from "@/lib/time";

export const metadata: Metadata = { title: "Customers · BluBook" };
export const dynamic = "force-dynamic";

const entityLabel = (value: string | null) =>
  value ? value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()) : "—";

const date = (value: string) =>
  new Intl.DateTimeFormat(SAST_LOCALE, {
    timeZone: SAST,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "staff") redirect("/dashboard");

  const { q } = await searchParams;
  const query = q?.trim().slice(0, 100) ?? "";
  const customers = await getCustomers(query);

  return (
    <div className="mx-auto max-w-[92rem] space-y-7">
      <header className="border-b border-ink pb-7 lg:flex lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cobalt">Operations / Customer directory</p>
          <h1 className="mt-3 font-heading text-4xl leading-none sm:text-5xl">Customers</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/65">Find and maintain customer identity, contact, billing, address and tax information.</p>
        </div>
        <Link href="/dashboard/onboard" className={`${buttonStyles()} mt-6 lg:mt-0`}>Onboard a client</Link>
      </header>

      <section className="border border-ink bg-paper-light p-4 sm:p-5" aria-label="Search customers">
        <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <div>
            <label htmlFor="customer-search" className={labelStyles}>Find a customer</label>
            <input id="customer-search" name="q" type="search" defaultValue={query} maxLength={100} placeholder="Customer ID, company, contact or email" className={fieldStyles} />
          </div>
          <Button type="submit">Search</Button>
          {query ? <Link href="/dashboard/customers" className={buttonStyles({ variant: "secondary" })}>Clear</Link> : null}
        </form>
        <p className="mt-3 text-xs text-ink/55" aria-live="polite">
          {query ? `${customers.length} customer${customers.length === 1 ? "" : "s"} found for “${query}”.` : `Showing ${customers.length} customer${customers.length === 1 ? "" : "s"}.`}
        </p>
      </section>

      {customers.length === 0 ? (
        <section className="border border-dashed border-ink/35 bg-cream/35 px-5 py-16 text-center">
          <p className="font-heading text-2xl">{query ? "No matching customers" : "No customers yet"}</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/55">{query ? "Try another Customer ID, company name, contact or email." : "Customers appear here after staff complete onboarding."}</p>
        </section>
      ) : (
        <section className="overflow-hidden border border-ink bg-paper-light" aria-label="Customer directory">
          <div className="overflow-x-auto">
            <table className="min-w-[76rem] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-ink bg-cream/60 font-mono text-[9px] uppercase tracking-[0.09em] text-ink/60">
                  <th className="px-5 py-4">Customer ID</th><th className="px-5 py-4">Trading name</th><th className="px-5 py-4">Registered name</th><th className="px-5 py-4">Primary contact</th><th className="px-5 py-4">Industry</th><th className="px-5 py-4">Service package</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Updated</th><th className="px-5 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink">
                {customers.map((customer) => (
                  <tr key={customer.id} className="align-top hover:bg-cobalt-wash/50">
                    <td className="px-5 py-5 font-mono text-[10px] font-semibold text-cobalt">{customer.customerId}</td>
                    <td className="px-5 py-5"><strong className="text-sm">{customer.tradingName}</strong><span className="mt-1 block text-xs capitalize text-ink/50">{entityLabel(customer.entityType)}</span></td>
                    <td className="px-5 py-5 text-sm">{customer.registeredName}</td>
                    <td className="px-5 py-5 text-sm"><span>{customer.contactName ?? "—"}</span><span className="mt-1 block text-xs text-ink/55">{customer.contactEmail ?? "No email"}</span></td>
                    <td className="px-5 py-5 text-sm">{customer.industry ?? "—"}</td>
                    <td className="px-5 py-5 text-sm">{customer.packageName ?? "No active package"}</td>
                    <td className="px-5 py-5"><StatusLabel status={customer.status} /></td>
                    <td className="px-5 py-5 text-xs text-ink/60">{date(customer.updatedAt)}</td>
                    <td className="px-5 py-5"><Link href={`/dashboard/customers/${customer.id}` as Route} className={buttonStyles({ variant: "secondary" })}>View & edit</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
