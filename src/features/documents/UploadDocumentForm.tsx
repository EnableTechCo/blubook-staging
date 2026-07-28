"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import { uploadDocument, type UploadState } from "@/features/documents/actions";
import type { DocumentCategory } from "@/services/dashboard";

// `compact` renders just a file picker + button, for satisfying a specific
// onboarding checklist item (title/category are passed as hidden fields). The
// full form exposes title, filing category, expiry, and the file.
export function UploadDocumentForm({
  compact = false,
  clientId,
  onboardingDocumentId,
  documentTypeId,
  defaultTitle,
  defaultCategory = "compliance",
  categories = [],
  onUploaded,
}: {
  compact?: boolean;
  clientId?: string;
  onboardingDocumentId?: string;
  documentTypeId?: string;
  defaultTitle?: string;
  defaultCategory?: "compliance" | "generated" | "other";
  categories?: DocumentCategory[];
  onUploaded?: () => void;
}) {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadDocument, undefined);
  const done = state !== undefined && "ok" in state;

  // Let a host (the upload dialog) react once the upload lands.
  useEffect(() => {
    if (done) onUploaded?.();
  }, [done, onUploaded]);

  const parents = categories.filter((c) => !c.parent_id);
  const childrenOf = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  if (compact) {
    return (
      <form action={action} className="flex flex-wrap items-center gap-2">
        {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
        {onboardingDocumentId ? (
          <input type="hidden" name="onboardingDocumentId" value={onboardingDocumentId} />
        ) : null}
        {documentTypeId ? <input type="hidden" name="documentTypeId" value={documentTypeId} /> : null}
        <input type="hidden" name="title" value={defaultTitle ?? "Document"} />
        <input type="hidden" name="category" value={defaultCategory} />
        <input
          type="file"
          name="file"
          required
          className="max-w-[15rem] font-body text-xs text-slate-600 file:mr-2 file:border file:border-ink/35 file:bg-paper file:px-2 file:py-1 file:font-body file:text-xs file:text-ink"
        />
        <Button type="submit" disabled={pending} className="min-h-9 px-3 text-xs">
          {pending ? "Uploading…" : "Upload"}
        </Button>
        {state && "error" in state ? (
          <span role="alert" className="font-body text-xs text-clay">
            {state.error}
          </span>
        ) : null}
        {done ? <span className="font-body text-xs text-teal">Uploaded.</span> : null}
      </form>
    );
  }

  return (
    <form action={action} aria-busy={pending} className="space-y-5">
      {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}

      <div>
        <label htmlFor="title" className={labelStyles}>
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={defaultTitle}
          maxLength={200}
          className={fieldStyles}
        />
      </div>

      <div>
        <label htmlFor="categoryId" className={labelStyles}>
          File under
        </label>
        <select id="categoryId" name="categoryId" defaultValue="" className={fieldStyles}>
          <option value="">Uncategorised</option>
          {parents.map((parent) => {
            const children = childrenOf(parent.id);
            return children.length > 0 ? (
              <optgroup key={parent.id} label={parent.name}>
                <option value={parent.id}>{parent.name} — general</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            );
          })}
        </select>
        <p className={helpTextStyles}>Used to sort the archive. You can leave this blank.</p>
      </div>

      <div>
        <label htmlFor="category" className={labelStyles}>
          Source
        </label>
        <select id="category" name="category" defaultValue={defaultCategory} className={fieldStyles}>
          <option value="compliance">Compliance</option>
          <option value="generated">Generated</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="expiresAt" className={labelStyles}>
          Expiry date <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <input id="expiresAt" name="expiresAt" type="date" className={fieldStyles} />
      </div>

      <div>
        <label htmlFor="file" className={labelStyles}>
          File
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          className="mt-2 w-full border border-ink/35 bg-paper-light p-2.5 font-body text-sm text-ink file:mr-3 file:border file:border-ink/35 file:bg-paper file:px-3 file:py-1.5 file:font-body file:text-xs file:text-ink"
        />
        <p className={helpTextStyles}>Up to 10MB.</p>
      </div>

      {state && "error" in state ? (
        <p
          role="alert"
          className="border-l-4 border-clay bg-clay/10 px-4 py-3 font-body text-sm leading-6 text-ink"
        >
          {state.error}
        </p>
      ) : null}
      {done ? (
        <p className="border-l-4 border-teal bg-emerald-50 px-4 py-3 font-body text-sm leading-6 text-ink">
          Document uploaded.
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        <span aria-live="polite">{pending ? "Uploading…" : "Upload document"}</span>
        {!pending ? <span aria-hidden="true">→</span> : null}
      </Button>
    </form>
  );
}
