"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Record, RecordHeader, RecordList, RecordMeta, RecordMetaList } from "@/components/ui/RecordList";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import { money } from "@/features/dashboard/ui";
import type { ClientProduct } from "@/features/products/queries";
import { createQuotation, type QuotationState } from "@/features/quotations/actions";
import type { QuotationRow } from "@/features/quotations/queries";
import { lineTotals, quotationTotals } from "@/features/quotations/totals";

const thirtyDays = () => new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

export function QuotationBuilder({
  products,
  quotations,
  letterheadGaps,
}: {
  products: ClientProduct[];
  quotations: QuotationRow[];
  letterheadGaps: string[];
}) {
  const [state, action, pending] = useActionState<QuotationState, FormData>(
    createQuotation,
    undefined,
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const chosen = useMemo(
    () =>
      products
        .filter((product) => (quantities[product.id] ?? 0) > 0)
        .map((product) => ({
          product,
          quantity: quantities[product.id]!,
          ...lineTotals({
            quantity: quantities[product.id]!,
            unit_price: Number(product.unit_price),
            vat_rate: Number(product.vat_rate),
          }),
        })),
    [products, quantities],
  );

  // The same arithmetic the server will do, so the figure on screen is the
  // figure on the PDF rather than an optimistic guess.
  const totals = useMemo(
    () =>
      quotationTotals(
        chosen.map((line) => ({
          quantity: line.quantity,
          unit_price: Number(line.product.unit_price),
          vat_rate: Number(line.product.vat_rate),
        })),
      ),
    [chosen],
  );

  const setQuantity = (id: string, value: string) => {
    const quantity = Number(value);
    setQuantities((current) => ({ ...current, [id]: Number.isFinite(quantity) ? quantity : 0 }));
  };

  if (products.length === 0) {
    return (
      <div className="border border-ink bg-paper-light px-6 py-10 text-center">
        <p className="font-heading text-2xl">Nothing to quote yet</p>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink/60">
          A quotation is priced from your product list. Add products under Sales · Product list and
          they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {letterheadGaps.length > 0 ? (
        <div className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink">
          <p className="font-semibold">Your letterhead will print without:</p>
          <ul className="mt-1 list-disc pl-5">
            {letterheadGaps.map((gap) => <li key={gap}>{gap}</li>)}
          </ul>
        </div>
      ) : null}

      <form action={action} className="space-y-5">
        <input type="hidden" name="lines" value={JSON.stringify(chosen.map((line) => ({ productId: line.product.id, quantity: line.quantity })))} />

        <section className="border border-ink bg-paper-light px-5 py-5">
          <h2 className="font-heading text-2xl leading-none">Who it is for</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="recipientName" className={labelStyles}>Contact name</label>
              <input id="recipientName" name="recipientName" required maxLength={200} className={fieldStyles} />
            </div>
            <div>
              <label htmlFor="recipientCompany" className={labelStyles}>Company <span className="font-normal text-ink/45">(optional)</span></label>
              <input id="recipientCompany" name="recipientCompany" maxLength={200} className={fieldStyles} />
            </div>
            <div>
              <label htmlFor="recipientEmail" className={labelStyles}>Email <span className="font-normal text-ink/45">(optional)</span></label>
              <input id="recipientEmail" name="recipientEmail" type="email" maxLength={200} className={fieldStyles} />
            </div>
            <div>
              <label htmlFor="expiresAt" className={labelStyles}>Valid until</label>
              <input id="expiresAt" name="expiresAt" type="date" defaultValue={thirtyDays()} className={fieldStyles} />
              <p className={helpTextStyles}>Thirty days from today unless you change it.</p>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="recipientAddress" className={labelStyles}>Address <span className="font-normal text-ink/45">(optional)</span></label>
              <textarea id="recipientAddress" name="recipientAddress" rows={3} maxLength={600} className={fieldStyles} />
            </div>
          </div>
        </section>

        <section className="border border-ink bg-paper-light px-5 py-5">
          <h2 className="font-heading text-2xl leading-none">What is being quoted</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Set a quantity against a product to put it on the quotation. Prices are taken from your
            list as it stands today and copied onto the quotation, so repricing later will not
            change what you sent.
          </p>

          <ul className="mt-4 grid gap-px border border-ink bg-ink">
            {products.map((product) => (
              <li key={product.id} className="flex flex-wrap items-center justify-between gap-4 bg-paper px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{product.description}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-cobalt">
                    {product.product_code} · {money(product.unit_price)}
                    {product.unit ? ` per ${product.unit}` : ""} · {product.vat_rate}% VAT
                  </span>
                </span>
                <span className="w-28 shrink-0">
                  <label htmlFor={`qty-${product.id}`} className="sr-only">
                    Quantity of {product.description}
                  </label>
                  <input
                    id={`qty-${product.id}`}
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="0"
                    value={quantities[product.id] ?? ""}
                    onChange={(event) => setQuantity(product.id, event.target.value)}
                    className={fieldStyles}
                  />
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <label htmlFor="notes" className={labelStyles}>Notes <span className="font-normal text-ink/45">(optional)</span></label>
            <textarea id="notes" name="notes" rows={2} maxLength={2000} className={fieldStyles} />
          </div>
        </section>

        <section className="border border-ink bg-paper-light px-5 py-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={labelStyles}>
                {chosen.length} line{chosen.length === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-sm text-ink/65">
                Subtotal {money(totals.subtotal)} · VAT {money(totals.vatTotal)}
              </p>
            </div>
            <p className="font-heading text-3xl leading-none">{money(totals.total)}</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-ink/30 pt-5">
            {state && "error" in state ? (
              <p role="alert" className="mr-auto text-[13px] leading-5 text-clay">{state.error}</p>
            ) : state && "ok" in state ? (
              <p role="status" className="mr-auto text-[13px] leading-5 text-teal">
                {state.reference} raised and filed.
              </p>
            ) : null}
            <Button type="submit" disabled={pending || chosen.length === 0}>
              {pending ? "Raising…" : "Create quotation"}
            </Button>
          </div>
        </section>
      </form>

      {quotations.length > 0 ? (
        <section>
          <h2 className="mb-3 font-heading text-2xl leading-none">Quotations you have raised</h2>
          <RecordList>
            {quotations.map((quotation) => (
              <Record key={quotation.id}>
                <RecordHeader>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold leading-6 text-ink">
                      {quotation.recipient_company ?? quotation.recipient_name}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] font-semibold text-cobalt">
                      {quotation.reference}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <p className="font-heading text-2xl leading-none">{money(quotation.total)}</p>
                    {quotation.document_id ? (
                      <a
                        href={`/api/documents/${quotation.document_id}`}
                        className="inline-flex min-h-10 items-center border border-cobalt px-4 py-2 text-xs font-semibold text-cobalt hover:bg-cobalt hover:text-paper"
                      >
                        Download
                      </a>
                    ) : null}
                  </div>
                </RecordHeader>
                <RecordMetaList>
                  <RecordMeta label="Issued">{quotation.issue_date}</RecordMeta>
                  <RecordMeta label="Valid until">{quotation.expires_at}</RecordMeta>
                </RecordMetaList>
              </Record>
            ))}
          </RecordList>
        </section>
      ) : null}
    </div>
  );
}
