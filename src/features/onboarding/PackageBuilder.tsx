"use client";

import { useState } from "react";

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

const rand = (n: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

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

  const base = packages.find((p) => p.id === baseId);
  const baseItems = base?.items ?? [];
  const baseIds = new Set(baseItems.map((i) => i.id));
  const extraItems = extras
    .map((id) => lineItems.find((li) => li.id === id))
    .filter((x): x is BuilderLineItem => Boolean(x));

  const isFlex = extras.length > 0;
  const total = isFlex
    ? [...baseItems, ...extraItems].reduce((s, i) => s + Number(i.price), 0)
    : Number(base?.price ?? 0);
  const allIds = [...baseItems.map((i) => i.id), ...extras];
  const addable = lineItems.filter((li) => !baseIds.has(li.id) && !extras.includes(li.id));

  function changeBase(id: string) {
    setBaseId(id);
    setExtras([]);
  }
  function addItem() {
    if (toAdd) {
      setExtras((e) => [...e, toAdd]);
      setToAdd("");
    }
  }

  const fieldCls =
    "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500";

  return (
    <div className="space-y-4">
      <input type="hidden" name="packageMode" value={isFlex ? "flex" : "standard"} />
      <input type="hidden" name="packageId" value={baseId} />
      <input type="hidden" name="lineItemIds" value={JSON.stringify(allIds)} />

      <div>
        <label htmlFor="basePackage" className="text-sm font-medium text-slate-700">
          Standard package
        </label>
        <select
          id="basePackage"
          value={baseId}
          onChange={(e) => changeBase(e.target.value)}
          className={fieldCls}
        >
          {packages.length === 0 ? <option value="">No packages available</option> : null}
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.tier} · {rand(Number(p.price))}
            </option>
          ))}
        </select>
      </div>

      {base ? (
        <div className="rounded-md border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-800">Included items</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${isFlex ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-700"}`}
            >
              {isFlex ? "Flex" : "Standard"}
            </span>
          </div>
          <ul className="space-y-1 text-sm">
            {baseItems.map((i) => (
              <li key={i.id} className="flex justify-between text-slate-600">
                <span>
                  {i.name} <span className="text-xs text-slate-400">· {i.tier}</span>
                </span>
                <span>{isFlex ? rand(Number(i.price)) : "included"}</span>
              </li>
            ))}
            {extraItems.map((i) => (
              <li key={i.id} className="flex items-center justify-between text-slate-700">
                <span>
                  {i.name} <span className="text-xs text-slate-400">· {i.tier} · added</span>
                </span>
                <span className="flex items-center gap-2">
                  {rand(Number(i.price))}
                  <button
                    type="button"
                    onClick={() => setExtras((e) => e.filter((x) => x !== i.id))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    remove
                  </button>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="addItem" className="text-xs font-medium text-slate-500">
                Add a line item (switches to Flex)
              </label>
              <select
                id="addItem"
                value={toAdd}
                onChange={(e) => setToAdd(e.target.value)}
                className={fieldCls}
              >
                <option value="">Select an item…</option>
                {addable.map((li) => (
                  <option key={li.id} value={li.id}>
                    {li.name} · {li.serviceName} · {li.tier} · {rand(Number(li.price))}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={addItem}
              disabled={!toAdd}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-sm">
            <span className="text-slate-500">
              {isFlex ? "Flex total (per line item)" : "Package price (set)"}
            </span>
            <span className="font-semibold">{rand(total)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
