"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import {
  createLineItem,
  savePackage,
  type CatalogueState,
} from "@/features/catalogue/actions";
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
  fulfilmentMode: string;
}

export interface EditorService {
  id: string;
  name: string;
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
  services,
  editing,
  trigger,
  onDone,
}: {
  lineItems: EditorLineItem[];
  services: EditorService[];
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
            services={services}
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
  services,
  editing,
  onCancel,
}: {
  id: string;
  action: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  lineItems: EditorLineItem[];
  services: EditorService[];
  editing?: EditorPackage;
  onCancel: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  // Once an admin edits the slug by hand we stop deriving it, so renaming a live
  // package cannot silently change its slug.
  const [slugTouched, setSlugTouched] = useState(Boolean(editing));
  const [selected, setSelected] = useState<string[]>(editing?.lineItemIds ?? []);
  // Items created from inside this dialog, appended so they can be ticked
  // without closing and reopening the editor.
  const [created, setCreated] = useState<EditorLineItem[]>([]);

  // Creating an item revalidates the page, so it can arrive in `lineItems` as
  // well as the local copy. Prefer the server's row and drop the duplicate.
  const allItems = [
    ...lineItems,
    ...created.filter((item) => !lineItems.some((existing) => existing.id === item.id)),
  ];
  const derivedSlug = slugTouched ? slug : toPackageSlug(name);
  const selectedItems = allItems.filter((item) => selected.includes(item.id));
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
          {allItems.length === 0 ? (
            <p className="font-body text-sm text-ink/65">
              No active line items in the catalogue yet — add one below.
            </p>
          ) : (
            <ul className="max-h-56 space-y-1 overflow-y-auto">
              {allItems.map((item) => (
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
                      <span
                        className={`ml-2 border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] ${
                          item.fulfilmentMode === "automatic"
                            ? "border-teal/50 text-teal"
                            : "border-cobalt/50 text-cobalt"
                        }`}
                      >
                        {item.fulfilmentMode === "automatic" ? "Automatic" : "Service request"}
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

          <NewLineItem
            services={services}
            disabled={pending}
            onCreated={(item) => {
              setCreated((current) => [...current, item]);
              setSelected((current) => [...current, item.id]);
            }}
          />
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

// Creating a line item from inside the package editor. Deliberately not a nested
// <form> — HTML forbids that — so the fields are plain inputs submitted through
// a transition, and the new item is handed back to be ticked immediately.
function NewLineItem({
  services,
  disabled,
  onCreated,
}: {
  services: EditorService[];
  disabled: boolean;
  onCreated: (item: EditorLineItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [name, setName] = useState("");
  const [tier, setTier] = useState<string>("basic");
  const [mode, setMode] = useState<string>("service_request");
  const [price, setPrice] = useState("");

  function submit() {
    setError(null);
    const formData = new FormData();
    formData.set("serviceId", serviceId);
    formData.set("name", name);
    formData.set("tier", tier);
    formData.set("fulfilmentMode", mode);
    formData.set("price", price);

    startSaving(async () => {
      const result = await createLineItem(undefined, formData);
      if (!result) return;
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onCreated({
        id: result.lineItem.id,
        name: result.lineItem.name,
        tier,
        price: Number(price),
        serviceName: services.find((s) => s.id === serviceId)?.name ?? "—",
        fulfilmentMode: mode,
      });
      setName("");
      setPrice("");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled || services.length === 0}
        className="mt-3 border border-ink/35 px-3 py-1.5 font-body text-xs font-semibold hover:bg-cream disabled:opacity-50"
      >
        + Add line item
      </button>
    );
  }

  return (
    <div className="mt-3 border border-ink/25 bg-paper p-4">
      <p className={labelStyles}>New line item</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="newItemService" className={labelStyles}>
            Service
          </label>
          <select
            id="newItemService"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            className={fieldStyles}
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="newItemName" className={labelStyles}>
            Name
          </label>
          <input
            id="newItemName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={200}
            className={fieldStyles}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="newItemTier" className={labelStyles}>
            Tier
          </label>
          <select
            id="newItemTier"
            value={tier}
            onChange={(event) => setTier(event.target.value)}
            className={fieldStyles}
          >
            {SERVICE_TIERS.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="newItemPrice" className={labelStyles}>
            Price (ZAR)
          </label>
          <input
            id="newItemPrice"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={fieldStyles}
          />
        </div>
      </div>

      <fieldset className="mt-3">
        <legend className={labelStyles}>How is it actioned?</legend>
        <div className="mt-2 space-y-2">
          <label className="flex cursor-pointer items-start gap-2.5 font-body text-sm">
            <input
              type="radio"
              name="newItemMode"
              value="service_request"
              checked={mode === "service_request"}
              onChange={() => setMode("service_request")}
              className="mt-1"
            />
            <span>
              By a service request
              <span className="block text-xs text-ink/65">
                A request is raised and routed to a Service Partner.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 font-body text-sm">
            <input
              type="radio"
              name="newItemMode"
              value="automatic"
              checked={mode === "automatic"}
              onChange={() => setMode("automatic")}
              className="mt-1"
            />
            <span>
              Automatically by the system
              <span className="block text-xs text-ink/65">
                Included in the package, but raises no request and needs no partner.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="mt-3 border-l-4 border-clay bg-clay/10 px-3 py-2 font-body text-xs">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="border border-ink bg-ink px-3 py-1.5 font-body text-xs font-semibold text-paper-light hover:bg-cobalt disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add line item"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={saving}
          className="font-body text-xs text-ink/65 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
