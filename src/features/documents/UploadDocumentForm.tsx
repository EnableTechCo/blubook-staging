"use client";

import { useActionState } from "react";
import { uploadDocument, type UploadState } from "@/features/documents/actions";

const field =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500";

// `compact` renders just a file picker + button, for satisfying a specific
// checklist item (title/category/type are passed as hidden fields). The full
// form exposes title, category, and expiry for a general upload.
export function UploadDocumentForm({
  compact = false,
  clientId,
  onboardingDocumentId,
  documentTypeId,
  defaultTitle,
  defaultCategory = "compliance",
}: {
  compact?: boolean;
  clientId?: string;
  onboardingDocumentId?: string;
  documentTypeId?: string;
  defaultTitle?: string;
  defaultCategory?: "compliance" | "generated" | "other";
}) {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadDocument, undefined);
  const done = state && "ok" in state;

  return (
    <form action={action} className={compact ? "flex items-center gap-2" : "space-y-3"}>
      {clientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
      {onboardingDocumentId ? (
        <input type="hidden" name="onboardingDocumentId" value={onboardingDocumentId} />
      ) : null}
      {documentTypeId ? <input type="hidden" name="documentTypeId" value={documentTypeId} /> : null}

      {compact ? (
        <>
          <input type="hidden" name="title" value={defaultTitle ?? "Document"} />
          <input type="hidden" name="category" value={defaultCategory} />
          <input type="file" name="file" required className="text-xs" />
        </>
      ) : (
        <>
          <div>
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input name="title" type="text" required defaultValue={defaultTitle} className={field} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Category</label>
            <select name="category" defaultValue={defaultCategory} className={field}>
              <option value="compliance">Compliance</option>
              <option value="generated">Generated</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Expiry date (optional)</label>
            <input name="expiresAt" type="date" className={field} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">File</label>
            <input type="file" name="file" required className={`${field} py-1.5`} />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-800 disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>

      {state && "error" in state ? (
        <p role="alert" className="text-xs text-red-600">
          {state.error}
        </p>
      ) : null}
      {done ? <p className="text-xs text-emerald-700">Uploaded.</p> : null}
    </form>
  );
}
