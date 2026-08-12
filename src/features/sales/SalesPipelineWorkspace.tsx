"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { OpportunityEditorDialog } from "@/features/sales/OpportunityEditorDialog";
import {
  deleteOpportunity,
  type OpportunityActionState,
} from "@/features/sales/actions";
import type {
  ForecastCategory,
  OpportunitySource,
  SalesOpportunityWithSalesOrder,
} from "@/features/sales/types";

const zar = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });

function fiscalPeriod(opportunity: SalesOpportunityWithSalesOrder): string {
  if (!opportunity.fiscal_year) return "—";
  return [
    `FY${opportunity.fiscal_year}`,
    opportunity.fiscal_quarter ? `Q${opportunity.fiscal_quarter}` : null,
    opportunity.fiscal_week ? `W${opportunity.fiscal_week}` : null,
  ].filter(Boolean).join(" · ");
}

function DeleteOpportunity({ opportunity }: { opportunity: SalesOpportunityWithSalesOrder }) {
  const [state, action, pending] = useActionState<OpportunityActionState, FormData>(
    deleteOpportunity,
    undefined,
  );
  const protectedOpportunity = Boolean(opportunity.booked_at || opportunity.salesOrder);

  return (
    <div>
      <form
        action={action}
        onSubmit={(event) => {
          if (!window.confirm(`Delete ${opportunity.opportunity_name}? This cannot be undone.`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="opportunityId" value={opportunity.id} />
        <Button type="submit" variant="quiet" disabled={pending || protectedOpportunity}>
          {pending ? "Deleting…" : "Delete"}
        </Button>
      </form>
      {protectedOpportunity ? (
        <p className="mt-1 text-[10px] text-ink/50">Linked or booked opportunities cannot be deleted.</p>
      ) : state && "error" in state ? (
        <p role="alert" className="mt-1 max-w-48 text-[10px] leading-4 text-clay">{state.error}</p>
      ) : null}
    </div>
  );
}

export function SalesPipelineWorkspace({
  opportunities,
  sources,
  categories,
}: {
  opportunities: SalesOpportunityWithSalesOrder[];
  sources: OpportunitySource[];
  categories: ForecastCategory[];
}) {
  const sourceNames = new Map(sources.map((source) => [source.code, source.name]));
  const categoryNames = new Map(categories.map((category) => [category.code, category.name]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-sm leading-6 text-ink/60">
          Keep opportunities here before a sales order exists. Deal IDs are generated automatically.
        </p>
        <OpportunityEditorDialog sources={sources} categories={categories} />
      </div>

      {opportunities.length === 0 ? (
        <div className="border border-ink bg-paper-light px-6 py-10 text-center">
          <p className="font-heading text-2xl">No opportunities yet</p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink/60">
            Add your first opportunity to begin building a private sales pipeline for your company.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-ink bg-paper-light [scrollbar-gutter:stable]">
          <table className="min-w-[70rem] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-ink bg-cream/60">
                {[
                  "Deal ID", "Opportunity", "Source", "Category", "Revenue", "Expected period", "Actions",
                ].map((heading) => (
                  <th key={heading} scope="col" className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/65">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opportunity) => (
                <tr key={opportunity.id} className="border-b border-ink/35 last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-[11px] font-semibold text-cobalt">{opportunity.deal_reference}</td>
                  <th scope="row" className="min-w-64 px-4 py-4 text-sm font-semibold">{opportunity.opportunity_name}</th>
                  <td className="px-4 py-4 text-sm text-ink/65">{sourceNames.get(opportunity.opportunity_source) ?? opportunity.opportunity_source}</td>
                  <td className="px-4 py-4"><span className="border border-cobalt/45 bg-cobalt-wash px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-cobalt">{categoryNames.get(opportunity.forecast_category) ?? opportunity.forecast_category}</span></td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold">{zar.format(opportunity.revenue)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-ink/65">{fiscalPeriod(opportunity)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-start gap-2">
                      {opportunity.salesOrder ? (
                        <Link
                          href={`/dashboard/reports/requests/${opportunity.salesOrder.id}`}
                          className="inline-flex min-h-10 items-center border border-cobalt px-4 py-2 text-xs font-semibold text-cobalt hover:bg-cobalt hover:text-paper"
                        >
                          View PO
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/transact/sales-order?opportunityId=${opportunity.id}`}
                          className="inline-flex min-h-10 items-center border border-cobalt bg-cobalt px-4 py-2 text-xs font-semibold text-paper hover:bg-ink"
                        >
                          Submit PO
                        </Link>
                      )}
                      {!opportunity.salesOrder ? (
                        <OpportunityEditorDialog sources={sources} categories={categories} opportunity={opportunity} />
                      ) : null}
                      <DeleteOpportunity opportunity={opportunity} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
