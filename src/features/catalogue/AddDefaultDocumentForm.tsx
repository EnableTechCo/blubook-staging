"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  fieldStyles,
  fileFieldStyles,
  helpTextStyles,
  labelStyles,
} from "@/components/ui/formStyles";
import {
  addDefaultDocument,
  type DefaultDocumentState,
} from "@/features/catalogue/defaultDocumentActions";

// The default folders every client is seeded with, so staff pick a destination
// rather than typing a slug. Matches seed_default_folders in the folders
// migration; a client who renamed a folder keeps its slug.
const FOLDERS = [
  { slug: "", label: "Leave unfiled" },
  { slug: "sales", label: "Sales Articles" },
  { slug: "purchase-orders", label: "Sales Articles → Purchase Orders" },
  { slug: "receipts", label: "Sales Articles → Receipts" },
  { slug: "invoices", label: "Sales Articles → Invoices" },
  { slug: "proof-of-delivery", label: "Sales Articles → POD's" },
  { slug: "human-resources", label: "Human Resources Articles" },
  { slug: "employment-contracts", label: "Human Resources → Employment contracts" },
  { slug: "hr-policies", label: "Human Resources → Essential HR Policies" },
  { slug: "warehouse-logistics", label: "Warehouse and Logistics" },
  { slug: "finance", label: "Finance" },
  { slug: "legal", label: "Legal" },
];

export function AddDefaultDocumentForm({
  workGroups,
}: {
  workGroups: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<DefaultDocumentState, FormData>(
    addDefaultDocument,
    undefined,
  );
  const done = state !== undefined && "ok" in state;

  return (
    <form action={action} aria-busy={pending} className="space-y-5">
      <div>
        <label htmlFor="workGroupId" className={labelStyles}>
          Sent to
        </label>
        <select id="workGroupId" name="workGroupId" defaultValue="" className={fieldStyles}>
          <option value="">Every client — a BluBook document</option>
          {workGroups.map((group) => (
            <option key={group.id} value={group.id}>
              Clients whose package includes {group.name}
            </option>
          ))}
        </select>
        <p className={helpTextStyles}>
          A work group&apos;s documents only reach clients who bought that group&apos;s services.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelStyles}>
            Name
          </label>
          <input id="name" name="name" type="text" required maxLength={200} className={fieldStyles} />
          <p className={helpTextStyles}>Shown to the client as the request title.</p>
        </div>
        <div>
          <label htmlFor="targetFolderSlug" className={labelStyles}>
            File into
          </label>
          <select id="targetFolderSlug" name="targetFolderSlug" defaultValue="" className={fieldStyles}>
            {FOLDERS.map((folder) => (
              <option key={folder.slug} value={folder.slug}>
                {folder.label}
              </option>
            ))}
          </select>
          <p className={helpTextStyles}>The folder in each client&apos;s own archive.</p>
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelStyles}>
          Description <span className="font-normal text-ink/45">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={2000}
          className="mt-1.5 w-full border border-ink/35 bg-cream p-3 font-body text-sm text-ink outline-none focus:border-cobalt focus:ring-[3px] focus:ring-cobalt/15"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <div>
          <label htmlFor="file" className={labelStyles}>
            File
          </label>
          <input id="file" name="file" type="file" required className={fileFieldStyles} />
          <p className={helpTextStyles}>Up to 10MB. Copied to each client, so their copy survives changes here.</p>
        </div>
        <div>
          <label htmlFor="sortOrder" className={labelStyles}>
            Order
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            max={9999}
            defaultValue={0}
            className={fieldStyles}
          />
        </div>
      </div>

      {state && "error" in state ? (
        <p role="alert" className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink">
          {state.error}
        </p>
      ) : null}
      {done ? (
        <p className="border-l-[3px] border-teal bg-teal/10 px-4 py-3 text-[13px] leading-6 text-ink">
          Added. Clients onboarded from now on will receive it.
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add to library"}
      </Button>
    </form>
  );
}
