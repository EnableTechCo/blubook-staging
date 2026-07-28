"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import { savePackage, type CatalogueState } from "@/features/catalogue/actions";
import {
  BILLING_INTERVALS,
  SERVICE_TIERS,
  toPackageSlug,
} from "@/lib/validation/catalogue";

export interface EditorLineItem {
  id: string;
  name: string;
  tier: string;
  price: number;
  serviceName: string;
}

export interface EditorPackage {
  id: string;
  name: string;
  slug: string;
  tier: string;
  price: number;
  description: string | null;
  billing_interval: string;
  lineItemIds: string[];
}

const INTERVAL_LABEL: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
  one_time: "One-time",
};

const rand = (value: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(value);

export function PackageEditorDialog({
  lineItems,
  editing,
  trigger,
  onDone,
}: {
  lineItems: EditorLineItem[];
  editing?: EditorPackage;
  trigger: { label: string; variant?: "primary" | "secondary" };
  onDone?: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CatalogueState, FormData>(
    savePackage,
    undefined,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Close once the save lands. Closing the element fires its own close event,
  // which owns the React state, so nothing sets state from inside the effect.
  const saved = state !== undefined && "ok" in state;
  useEffect(() => {
    if (!saved) return;
    dialogRef.current?.close();
    onDone?.();
  }, [saved, onDone]);

  return (
    <>
      <Button
        type="button"
        variant={trigger.variant ?? "primary"}
        onClick={() => setOpen(true)}
      >
        {trigger.label}
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="package-editor-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Backdrop click closes, but never mid-save.
          if (event.target === dialogRef.current && !pending) setOpen(false);
        }}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        className="w-[min(44rem,calc(100vw-2rem))] border border-ink bg-paper-light p-0 text-ink backdrop:bg-ink/50"
      >
        {/* Mounted only while open, so a cancelled edit never leaks into the next. */}
        {open ? (
          <PackageForm
            id="package-editor-title"
            action={action}
            pending={pending}
            error={state && "error" in state ? state.error : null}
            lineItems={lineItems}
            editing={editing}
            onCancel={() => setOpen(false)}
          />
        ) : null}
      </dialog>
    </>
  );
}

function PackageForm({
  id,
  action,
  pending,
  error,
  lineItems,
  editing,
  onCancel,
}: {
  id: string;
  action: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  lineItems: EditorLineItem[];
  editing?: EditorPackage;
  onCancel: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  // Once an admin edits the slug by hand we stop deriving it, so renaming a live
  // package cannot silently change its slug.
  const [slugTouched, setSlugTouched] = useState(Boolean(editing));
  const [selected, setSelected] = useState<string[]>(editing?.lineItemIds ?? []);

  const derivedSlug = slugTouched ? slug : toPackageSlug(name);
  const selectedItems = lineItems.filter((item) => selected.includes(item.id));
  const itemsTotal = selectedItems.reduce((sum, item) => sum + Number(item.price), 0);

  const toggle = (itemId: string) =>
    setSelected((current) =>
      current.includes(itemId)
        ? current.filter((value) => value !== itemId)
        : [...current, itemId],
    );

  return (
    <form action={action} aria-busy={pending}>
      {editing ? <input type="hidden" name="packageId" value={editing.id} /> : null}
      <input type="hidden" name="slug" value={derivedSlug} />
      <input type="hidden" name="lineItemIds" value={JSON.stringify(selected)} />

      <div className="flex items-start justify-between gap-4 border-b border-ink/20 px-6 py-4">
        <div>
          <p className="font-body text-[11px] font-medium uppercase tracking-[0.18em] text-ink/65">
            Service catalogue
          </p>
          <h2 id={id} className="mt-1 font-heading text-2xl font-normal tracking-[-0.02em]">
            {editing ? "Edit package" : "New package"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          aria-label="Close"
          className="min-h-9 border border-ink/35 px-3 font-body text-sm hover:bg-cream disabled:opacity-50"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelStyles}>
              Name
            </label>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={200}
              className={fieldStyles}
            />
          </div>
          <div>
            <label htmlFor="slugField" className={labelStyles}>
              Slug
            </label>
            <input
              id="slugField"
              value={derivedSlug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              required
              className={fieldStyles}
            />
            <p className={helpTextStyles}>
              {slugTouched ? "Set by hand." : "Follows the name until you edit it."}
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="tier" className={labelStyles}>
              Tier
            </label>
            <select
              id="tier"
              name="tier"
              defaultValue={editing?.tier ?? "basic"}
              className={fieldStyles}
            >
              {SERVICE_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="billingInterval" className={labelStyles}>
              Billing
            </label>
            <select
              id="billingInterval"
              name="billingInterval"
              defaultValue={editing?.billing_interval ?? "monthly"}
              className={fieldStyles}
            >
              {BILLING_INTERVALS.map((interval) => (
                <option key={interval} value={interval}>
                  {INTERVAL_LABEL[interval]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="price" className={labelStyles}>
              Price (ZAR)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={editing?.price ?? ""}
              required
              className={fieldStyles}
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className={labelStyles}>
            Description <span className="font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            maxLength={2000}
            defaultValue={editing?.description ?? ""}
            className={`${fieldStyles} min-h-0 py-2.5`}
          />
        </div>

        <fieldset className="border border-ink/20 p-4">
          <legend className={`px-2 ${labelStyles}`}>Included line items</legend>
          {lineItems.length === 0 ? (
            <p className="font-body text-sm text-ink/65">
              No active line items in the catalogue yet.
            </p>
          ) : (
            <ul className="max-h-56 space-y-1 overflow-y-auto">
              {lineItems.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-baseline gap-3 py-1.5 font-body text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={() => toggle(item.id)}
                      className="mt-0.5"
                    />
                    <span className="flex-1">
                      {item.name}
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink/55">
                        {item.serviceName} · {item.tier}
                      </span>
                    </span>
                    <span className="text-ink/65">{rand(Number(item.price))}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <p className={helpTextStyles}>
            {selected.length} selected · line items total {rand(itemsTotal)}. The package price
            above is what the client pays.
          </p>
        </fieldset>

        {error ? (
          <p
            role="alert"
            className="border-l-4 border-clay bg-clay/10 px-4 py-3 font-body text-sm leading-6"
          >
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-ink/20 px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="font-body text-sm text-ink/65 hover:text-ink disabled:opacity-50"
        >
          Cancel
        </button>
        <Button type="submit" disabled={pending}>
          <span aria-live="polite">{pending ? "Saving…" : "Save package"}</span>
        </Button>
      </div>
    </form>
  );
}
