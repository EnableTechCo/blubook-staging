"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Record,
  RecordActions,
  RecordHeader,
  RecordList,
  RecordMeta,
  RecordMetaList,
} from "@/components/ui/RecordList";
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
        <RecordList>
          {opportunities.map((opportunity) => (
            <Record key={opportunity.id}>
              <RecordHeader>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold leading-6 text-ink">
                    {opportunity.opportunity_name}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] font-semibold text-cobalt">
                    {opportunity.deal_reference}
                  </p>
                </div>
                <p className="shrink-0 text-right font-heading text-2xl leading-none text-ink">
                  {zar.format(opportunity.revenue)}
                </p>
              </RecordHeader>

              <RecordMetaList columns={3}>
                <RecordMeta label="Source">
                  {sourceNames.get(opportunity.opportunity_source) ?? opportunity.opportunity_source}
                </RecordMeta>
                <RecordMeta label="Forecast category">
                  <span className="inline-block border border-cobalt/45 bg-cobalt-wash px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-cobalt">
                    {categoryNames.get(opportunity.forecast_category) ?? opportunity.forecast_category}
                  </span>
                </RecordMeta>
                <RecordMeta label="Expected period">
                  {opportunity.fiscal_year ? (
                    fiscalPeriod(opportunity)
                  ) : (
                    <span className="text-ink/50">Not phased yet</span>
                  )}
                </RecordMeta>
              </RecordMetaList>

              {/* These were the last column of a table that started scrolling
                  sideways below about 1150px, which took them off the edge. */}
              <RecordActions>
                {opportunity.salesOrder ? (
                  <Link
                    href={`/dashboard/reports/requests/${opportunity.salesOrder.id}`}
                    className="inline-flex min-h-10 items-center border border-cobalt px-4 py-2 text-xs font-semibold text-cobalt hover:bg-cobalt hover:text-paper"
                  >
                    View sales order
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/transact/sales-order?opportunityId=${opportunity.id}`}
                    className="inline-flex min-h-10 items-center border border-cobalt bg-cobalt px-4 py-2 text-xs font-semibold text-paper hover:bg-ink"
                  >
                    Submit sales order
                  </Link>
                )}
                {!opportunity.salesOrder ? (
                  <OpportunityEditorDialog
                    sources={sources}
                    categories={categories}
                    opportunity={opportunity}
                  />
                ) : null}
                <DeleteOpportunity opportunity={opportunity} />
              </RecordActions>
            </Record>
          ))}
        </RecordList>
      )}
    </div>
  );
}
