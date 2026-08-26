"use client";

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
import { RecordDisclosure } from "@/components/ui/RecordDisclosure";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { money } from "@/features/dashboard/ui";
import { PRODUCT_COLUMNS } from "@/features/products/productList";
import {
  saveProduct,
  setProductActive,
  uploadProductList,
  type ProductRowState,
  type ProductUploadState,
} from "@/features/products/actions";
import type { ClientProduct } from "@/features/products/queries";

function ProductFields({ product }: { product?: ClientProduct }) {
  const id = product?.id ?? "new";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor={`code-${id}`} className={labelStyles}>Product code</label>
        <input
          id={`code-${id}`}
          name="productCode"
          required
          maxLength={80}
          defaultValue={product?.product_code}
          readOnly={Boolean(product)}
          className={fieldStyles}
        />
        {product ? (
          <p className="mt-1 text-[11px] leading-5 text-ink/55">
            The code identifies the product on an upload, so it cannot be changed here.
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor={`desc-${id}`} className={labelStyles}>Description</label>
        <input
          id={`desc-${id}`}
          name="description"
          required
          maxLength={400}
          defaultValue={product?.description}
          className={fieldStyles}
        />
      </div>
      <div>
        <label htmlFor={`price-${id}`} className={labelStyles}>Unit price (excl VAT)</label>
        <input
          id={`price-${id}`}
          name="unitPrice"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          defaultValue={product?.unit_price}
          className={fieldStyles}
        />
      </div>
      <div>
        <label htmlFor={`vat-${id}`} className={labelStyles}>VAT rate (%)</label>
        <input
          id={`vat-${id}`}
          name="vatRate"
          type="number"
          inputMode="decimal"
          min="0"
          max="100"
          step="0.01"
          defaultValue={product?.vat_rate ?? 15}
          className={fieldStyles}
        />
      </div>
      <div>
        <label htmlFor={`unit-${id}`} className={labelStyles}>Unit</label>
        <input id={`unit-${id}`} name="unit" maxLength={40} defaultValue={product?.unit ?? ""} className={fieldStyles} />
      </div>
      <div>
        <label htmlFor={`cat-${id}`} className={labelStyles}>Category</label>
        <input id={`cat-${id}`} name="category" maxLength={80} defaultValue={product?.category ?? ""} className={fieldStyles} />
      </div>
    </div>
  );
}

function ProductRecord({ product }: { product: ClientProduct }) {
  const [state, action, pending] = useActionState<ProductRowState, FormData>(saveProduct, undefined);

  return (
    <Record>
      <RecordHeader>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-6 text-ink">{product.description}</h3>
          <p className="mt-1 font-mono text-[11px] font-semibold text-cobalt">{product.product_code}</p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <p className="text-right">
            <span className="block font-heading text-2xl leading-none text-ink">
              {money(product.unit_price)}
            </span>
            <span className="mt-1 block text-[10px] text-ink/55">
              {product.vat_rate}% VAT{product.unit ? ` · per ${product.unit}` : ""}
            </span>
          </p>
          <StatusLabel status={product.active ? "active" : "withdrawn"} />
        </div>
      </RecordHeader>

      <RecordMetaList>
        <RecordMeta label="Category">
          {product.category ?? <span className="text-ink/50">Uncategorised</span>}
        </RecordMeta>
        <RecordMeta label="Unit">
          {product.unit ?? <span className="text-ink/50">Not stated</span>}
        </RecordMeta>
      </RecordMetaList>

      <RecordDisclosure label="Edit product">
        <form action={action} className="pb-1 pt-4">
          <ProductFields product={product} />
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            {state && "error" in state ? (
              <p role="alert" className="mr-auto text-[13px] leading-5 text-clay">{state.error}</p>
            ) : state && "ok" in state ? (
              <p role="status" className="mr-auto text-[13px] leading-5 text-teal">Saved.</p>
            ) : null}
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save product"}</Button>
          </div>
        </form>
      </RecordDisclosure>

      {/* Withdrawing never deletes: a quotation that already quoted this
          product has to keep explaining itself. */}
      <RecordActions>
        <form action={setProductActive}>
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="active" value={product.active ? "false" : "true"} />
          <Button type="submit" variant="quiet">
            {product.active ? "Withdraw from quotations" : "Return to quotations"}
          </Button>
        </form>
      </RecordActions>
    </Record>
  );
}

function UploadPanel() {
  const [state, action, pending] = useActionState<ProductUploadState, FormData>(
    uploadProductList,
    undefined,
  );

  return (
    <form action={action} className="border border-ink bg-paper-light px-5 py-5">
      <h2 className="font-heading text-2xl leading-none">Upload a product list</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
        An upload adds new products and updates the price of ones already here, matched on product
        code. It never withdraws anything — a list sent as a partial update would otherwise empty
        the rest. Withdraw a product on its own row instead.
      </p>

      <p className="mt-3 text-sm leading-6 text-ink/65">
        Columns accepted: {PRODUCT_COLUMNS.map((column) => column.header).join(", ")}. Common
        spellings work too — SKU, Price, VAT.{" "}
        <a
          href="/api/products/template"
          className="border-b border-ink font-semibold text-ink hover:border-cobalt hover:text-cobalt"
        >
          Download the blank template
        </a>
        .
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <label htmlFor="product-file" className={labelStyles}>Excel file (.xlsx)</label>
          <input id="product-file" name="file" type="file" accept=".xlsx,.xlsm" required className={fieldStyles} />
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Reading…" : "Upload list"}</Button>
      </div>

      {state && "error" in state ? (
        <p role="alert" className="mt-4 border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink">
          {state.error}
        </p>
      ) : null}

      {state && "ok" in state ? (
        <div role="status" className="mt-4 border border-cobalt bg-cobalt-wash px-4 py-3 text-[13px] leading-6 text-ink">
          <p>
            {state.added} added, {state.updated} updated.
          </p>
          {/* Rows that could not be read are named with the row number the
              client sees in Excel, rather than dropped quietly. */}
          {state.issues.length > 0 ? (
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold">
                {state.issues.length} row{state.issues.length === 1 ? "" : "s"} skipped
              </summary>
              <ul className="mt-2 space-y-1">
                {state.issues.map((issue) => (
                  <li key={`${issue.row}-${issue.message}`}>Row {issue.row}: {issue.message}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function AddProduct() {
  const [state, action, pending] = useActionState<ProductRowState, FormData>(saveProduct, undefined);

  return (
    <details className="border border-ink bg-paper-light px-5 py-4">
      <summary className="cursor-pointer list-none font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-cobalt [&::-webkit-details-marker]:hidden">
        Add a single product
      </summary>
      <form action={action} className="pt-4">
        <ProductFields />
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          {state && "error" in state ? (
            <p role="alert" className="mr-auto text-[13px] leading-5 text-clay">{state.error}</p>
          ) : state && "ok" in state ? (
            <p role="status" className="mr-auto text-[13px] leading-5 text-teal">Added.</p>
          ) : null}
          <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add product"}</Button>
        </div>
      </form>
    </details>
  );
}

export function ProductListWorkspace({ products }: { products: ClientProduct[] }) {
  const active = products.filter((product) => product.active).length;

  return (
    <div className="space-y-5">
      <UploadPanel />
      <AddProduct />

      {products.length === 0 ? (
        <div className="border border-ink bg-paper-light px-6 py-10 text-center">
          <p className="font-heading text-2xl">No products yet</p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink/60">
            Upload your price list and it becomes the list you quote from.
          </p>
        </div>
      ) : (
        <>
          <p className="text-[13px] leading-5 text-ink/60">
            {products.length} product{products.length === 1 ? "" : "s"}
            {active === products.length
              ? " · all available to quote"
              : ` · ${products.length - active} withdrawn`}
          </p>
          <RecordList>
            {products.map((product) => (
              <ProductRecord key={product.id} product={product} />
            ))}
          </RecordList>
        </>
      )}
    </div>
  );
}
