import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Section, WorkspaceHeader } from "@/features/dashboard/ui";
import { createClient } from "@/lib/supabase/server";
import { requireStaffRoute } from "@/services/staffRole";
import { setProviderTier } from "@/features/workgroups/actions";

export const metadata: Metadata = { title: "Partner tiers · BluBook" };
export const dynamic = "force-dynamic";

interface ProviderRow {
  id: string;
  business_name: string;
  status: string;
  tier: "standard" | "premium";
}

// Tiers used to sit on the work groups page, which is an operations screen.
// They do not belong together: routing decides who does the work, while a tier
// decides whether a partner learns which client the work is for. One is daily
// operations, the other is the single switch that lifts client anonymity — so
// it gets its own page, and only an administrator can open it.
export default async function PartnerTiersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const denied = await requireStaffRoute("/dashboard/partner-tiers");
  if (denied) redirect("/dashboard");

  const { error } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("providers")
    .select("id,business_name,status,tier")
    .order("business_name")
    .returns<ProviderRow[]>();
  const providers = data ?? [];

  return (
    <div className="mx-auto max-w-[92rem] space-y-8">
      <WorkspaceHeader
        eyebrow="Administration / Partners"
        title="Partner tiers"
        description="Premium partners see the business identity of every client in their work groups. Standard partners see only the Customer ID. Returning a partner to standard withdraws that identity immediately."
      />

      {error ? (
        <p
          role="alert"
          className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink"
        >
          {error}
        </p>
      ) : null}

      <Section
        title="Registered partners"
        subtitle="Promoting a partner is the only exemption from the anonymity rule, so it is kept to administrators"
      >
        {providers.length === 0 ? (
          <p className="text-sm text-ink/55">No providers registered.</p>
        ) : (
          <ul className="grid gap-px border border-ink bg-ink sm:grid-cols-2">
            {providers.map((provider) => {
              const premium = provider.tier === "premium";
              return (
                <li
                  key={provider.id}
                  className="flex items-center justify-between gap-3 bg-paper px-4 py-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">
                      {provider.business_name}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-[0.12em] ${
                        premium ? "text-rust" : "text-ink/45"
                      }`}
                    >
                      {premium ? "Premium partner" : "Standard partner"}
                    </span>
                  </span>
                  <form action={setProviderTier}>
                    <input type="hidden" name="providerId" value={provider.id} />
                    <input type="hidden" name="tier" value={premium ? "standard" : "premium"} />
                    <button
                      type="submit"
                      className={`text-xs underline-offset-4 hover:underline ${
                        premium ? "text-ink/55 hover:text-clay" : "text-rust"
                      }`}
                    >
                      {premium ? "Make standard" : "Make premium"}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
