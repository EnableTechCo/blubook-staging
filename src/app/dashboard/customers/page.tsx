import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";
import { getCustomers } from "@/features/customers/queries";
import { Button, buttonStyles } from "@/components/ui/Button";
import { StatusLabel } from "@/components/ui/StatusLabel";
import {
  Record,
  RecordHeader,
  RecordList,
  RecordMeta,
  RecordMetaList,
} from "@/components/ui/RecordList";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { SAST, SAST_LOCALE } from "@/lib/time";
import { WorkspaceHeader } from "@/features/dashboard/ui";

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
      <WorkspaceHeader
        eyebrow="Operations / Customer directory"
        title="Customers"
        description="Find and maintain customer identity, contact, billing, address and tax information."
        aside={<Link href="/dashboard/onboard" className={buttonStyles()}>Onboard a client</Link>}
      />

      <section className="workspace-panel p-4 sm:p-5" aria-label="Search customers">
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
        <section className="workspace-empty px-5 py-16 text-center">
          <p className="text-xl font-semibold">{query ? "No matching customers" : "No customers yet"}</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/55">{query ? "Try another Customer ID, company name, contact or email." : "Customers appear here after staff complete onboarding."}</p>
        </section>
      ) : (
        <section aria-label="Customer directory">
          <RecordList>
            {customers.map((customer) => (
              <Record key={customer.id}>
                <RecordHeader>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold leading-6 text-ink">
                      {customer.tradingName}
                    </h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-[11px] font-semibold text-cobalt">
                        {customer.customerId}
                      </span>
                      <span className="text-xs capitalize text-ink/50">
                        {entityLabel(customer.entityType)}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <StatusLabel status={customer.status} />
                    {/* The only action on the row, and the last column of a
                        table that scrolled sideways below about 1250px. */}
                    <Link
                      href={`/dashboard/customers/${customer.id}` as Route}
                      className={buttonStyles({ variant: "secondary" })}
                    >
                      View &amp; edit
                    </Link>
                  </div>
                </RecordHeader>

                <RecordMetaList columns={4}>
                  <RecordMeta label="Registered name">{customer.registeredName}</RecordMeta>
                  <RecordMeta label="Primary contact">
                    {customer.contactName ?? "—"}
                    <span className="mt-0.5 block truncate text-xs text-ink/55">
                      {customer.contactEmail ?? "No email"}
                    </span>
                  </RecordMeta>
                  <RecordMeta label="Industry">{customer.industry ?? "—"}</RecordMeta>
                  <RecordMeta label="Service package">
                    {customer.packageName ?? (
                      <span className="text-ink/50">No active package</span>
                    )}
                  </RecordMeta>
                </RecordMetaList>

                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.09em] text-ink/45">
                  Updated {date(customer.updatedAt)}
                </p>
              </Record>
            ))}
          </RecordList>
        </section>
      )}
    </div>
  );
}
