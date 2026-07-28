"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";

export interface BuilderPackage {
  id: string;
  name: string;
  tier: string;
  price: number;
  items: { id: string; name: string; tier: string; price: number }[];
}

export interface BuilderLineItem {
  id: string;
  name: string;
  tier: string;
  price: number;
  serviceName: string;
}

const rand = (value: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(value);

// Start from a standard package; adding any line item switches the assembly to
// Flex, which prices every included item individually instead of the set price.
export function PackageBuilder({
  packages,
  lineItems,
}: {
  packages: BuilderPackage[];
  lineItems: BuilderLineItem[];
}) {
  const [baseId, setBaseId] = useState(packages[0]?.id ?? "");
  const [extras, setExtras] = useState<string[]>([]);
  const [toAdd, setToAdd] = useState("");

  const base = packages.find((pkg) => pkg.id === baseId);
  const baseItems = base?.items ?? [];
  const baseIds = new Set(baseItems.map((item) => item.id));
  const extraItems = extras
    .map((id) => lineItems.find((lineItem) => lineItem.id === id))
    .filter((item): item is BuilderLineItem => Boolean(item));

  const isFlex = extras.length > 0;
  const total = isFlex
    ? [...baseItems, ...extraItems].reduce((sum, item) => sum + Number(item.price), 0)
    : Number(base?.price ?? 0);
  const allIds = [...baseItems.map((item) => item.id), ...extras];
  const addable = lineItems.filter(
    (lineItem) => !baseIds.has(lineItem.id) && !extras.includes(lineItem.id),
  );

  function changeBase(id: string) {
    setBaseId(id);
    setExtras([]);
    setToAdd("");
  }

  function addItem() {
    if (!toAdd) return;
    setExtras((current) => [...current, toAdd]);
    setToAdd("");
  }

  return (
    <div className="space-y-5">
      <input type="hidden" name="packageMode" value={isFlex ? "flex" : "standard"} />
      <input type="hidden" name="packageId" value={baseId} />
      <input type="hidden" name="lineItemIds" value={JSON.stringify(allIds)} />

      <div>
        <label htmlFor="basePackage" className={labelStyles}>
          Standard package
        </label>
        <select
          id="basePackage"
          value={baseId}
          onChange={(event) => changeBase(event.target.value)}
          className={fieldStyles}
        >
          {packages.length === 0 ? <option value="">No packages available</option> : null}
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name} · {pkg.tier} · {rand(Number(pkg.price))}
            </option>
          ))}
        </select>
      </div>

      {base ? (
        <section className="border border-ink bg-cream/35" aria-labelledby="package-contents">
          <header className="flex items-center justify-between gap-4 border-b border-ink px-4 py-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink/55">
                Current assembly
              </p>
              <h3 id="package-contents" className="mt-1 font-heading text-xl">
                {base.name}
              </h3>
            </div>
            <span
              className={`border px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ${
                isFlex
                  ? "border-cobalt bg-cobalt-wash text-cobalt-deep"
                  : "border-ink/30 bg-paper text-ink/65"
              }`}
            >
              {isFlex ? "Flex" : "Standard"}
            </span>
          </header>

          <ul className="divide-y divide-ink px-4">
            {baseItems.map((item) => (
              <li
                key={item.id}
                className="grid gap-1 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
              >
                <span className="font-medium">
                  {item.name}
                  <span className="ml-2 font-mono text-[9px] uppercase tracking-wide text-ink/45">
                    {item.tier}
                  </span>
                </span>
                <span className="text-xs text-ink/60">
                  {isFlex ? rand(Number(item.price)) : "Included"}
                </span>
              </li>
            ))}
            {extraItems.map((item) => (
              <li
                key={item.id}
                className="grid gap-2 border-l-2 border-l-cobalt py-3 pl-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
              >
                <span className="font-medium">
                  {item.name}
                  <span className="ml-2 font-mono text-[9px] uppercase tracking-wide text-cobalt">
                    {item.tier} · Added
                  </span>
                </span>
                <span className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="text-xs">{rand(Number(item.price))}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setExtras((current) => current.filter((extraId) => extraId !== item.id))
                    }
                    className="min-h-9 border border-clay px-3 text-[10px] font-semibold uppercase tracking-wide text-clay transition-colors hover:bg-clay hover:text-paper"
                    aria-label={`Remove ${item.name}`}
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>

          <div className="grid gap-3 border-t border-ink bg-paper-light p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <label htmlFor="addItem" className={labelStyles}>
                Add a line item
              </label>
              <p className="mt-1 text-xs text-ink/55">Adding an item switches pricing to Flex.</p>
              <select
                id="addItem"
                value={toAdd}
                onChange={(event) => setToAdd(event.target.value)}
                className={fieldStyles}
              >
                <option value="">Select an item…</option>
                {addable.map((lineItem) => (
                  <option key={lineItem.id} value={lineItem.id}>
                    {lineItem.name} · {lineItem.serviceName} · {lineItem.tier} ·{" "}
                    {rand(Number(lineItem.price))}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" variant="secondary" onClick={addItem} disabled={!toAdd}>
              Add item
            </Button>
          </div>

          <footer className="flex items-end justify-between gap-5 border-t border-ink bg-ink px-4 py-4 text-paper">
            <span className="max-w-40 font-mono text-[9px] uppercase leading-4 tracking-[0.09em] text-paper/65">
              {isFlex ? "Flex total / per-line pricing" : "Standard package price"}
            </span>
            <strong className="font-heading text-3xl font-normal">{rand(total)}</strong>
          </footer>
        </section>
      ) : null}
    </div>
  );
}
