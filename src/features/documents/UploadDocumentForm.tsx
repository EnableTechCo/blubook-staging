"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, helpTextStyles, labelStyles } from "@/components/ui/formStyles";
import { uploadDocument, type UploadState } from "@/features/documents/actions";
import type { DocumentFolder } from "@/services/dashboard";

// `compact` renders just a file picker + button, for satisfying a specific
// onboarding checklist item (title/category are passed as hidden fields). The
// full form exposes title, folder, expiry, and the file.
export function UploadDocumentForm({
  compact = false,
  clientId,
  onboardingDocumentId,
  requestId,
  documentTypeId,
  defaultTitle,
  defaultCategory = "compliance",
  folders = [],
  defaultFolderId,
  onUploaded,
}: {
  compact?: boolean;
  clientId?: string;
  onboardingDocumentId?: string;
  requestId?: string;
  documentTypeId?: string;
  defaultTitle?: string;
  defaultCategory?: "compliance" | "generated" | "other";
  folders?: DocumentFolder[];
  defaultFolderId?: string;
  onUploaded?: () => void;
}) {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadDocument, undefined);
  const done = state !== undefined && "ok" in state;

  // Let a host (the upload dialog) react once the upload lands.
  useEffect(() => {
    if (done) onUploaded?.();
  }, [done, onUploaded]);

  const parents = folders.filter((c) => !c.parent_id);
  const childrenOf = (parentId: string) => folders.filter((c) => c.parent_id === parentId);

  if (compact) {
    return (
      <form action={action} className="flex flex-wrap items-center gap-2">
        {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
        {onboardingDocumentId ? (
          <input type="hidden" name="onboardingDocumentId" value={onboardingDocumentId} />
        ) : null}
        {requestId ? <input type="hidden" name="requestId" value={requestId} /> : null}
        {documentTypeId ? <input type="hidden" name="documentTypeId" value={documentTypeId} /> : null}
        <input type="hidden" name="title" value={defaultTitle ?? "Document"} />
        <input type="hidden" name="category" value={defaultCategory} />
        <input
          type="file"
          name="file"
          accept=".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg"
          required
          className="max-w-[15rem] text-xs text-ink/60 file:mr-2 file:border file:border-ink/35 file:bg-cream file:px-2 file:py-1 file:text-xs file:text-ink"
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
      {requestId ? <input type="hidden" name="requestId" value={requestId} /> : null}

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
        <label htmlFor="folderId" className={labelStyles}>
          File under
        </label>
        <select
          id="folderId"
          name="folderId"
          defaultValue={defaultFolderId ?? ""}
          className={fieldStyles}
        >
          <option value="">Unfiled</option>
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
        <p className={helpTextStyles}>Choose a folder in your archive, or leave it unfiled.</p>
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
          Expiry date <span className="font-normal text-ink/45">(optional)</span>
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
          className="mt-1.5 w-full border border-ink/35 bg-cream p-2.5 text-sm text-ink file:mr-3 file:border file:border-ink/35 file:bg-paper file:px-3 file:py-1.5 file:text-xs file:text-ink"
        />
        <p className={helpTextStyles}>Up to 10MB.</p>
      </div>

      {state && "error" in state ? (
        <p
          role="alert"
          className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink"
        >
          {state.error}
        </p>
      ) : null}
      {done ? (
        <p className="border-l-[3px] border-teal bg-teal/10 px-4 py-3 text-[13px] leading-6 text-ink">
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
