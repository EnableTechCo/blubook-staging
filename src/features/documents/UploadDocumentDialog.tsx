"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { UploadDocumentForm } from "@/features/documents/UploadDocumentForm";
import type { DocumentCategory } from "@/services/dashboard";

// Upload lives behind a button rather than sitting open on the page. Uses a
// native <dialog>, so focus trapping, Esc-to-close and the backdrop come for
// free; the form closes it once the upload succeeds.
export function UploadDocumentDialog({
  categories,
  clientId,
  label = "Upload document",
}: {
  categories: DocumentCategory[];
  clientId?: string;
  label?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {label} <span aria-hidden="true">+</span>
      </Button>

      <dialog
        ref={ref}
        aria-labelledby="upload-dialog-title"
        onClose={() => setOpen(false)}
        // Clicking the backdrop (the dialog element itself) closes it.
        onClick={(event) => {
          if (event.target === ref.current) setOpen(false);
        }}
        className="w-[min(34rem,calc(100vw-2rem))] border border-ink bg-paper p-0 text-ink backdrop:bg-ink/55"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/60 px-6 py-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-rust">
              Document archive
            </p>
            <h2
              id="upload-dialog-title"
              className="mt-1 font-heading text-[1.75rem] font-normal tracking-[-0.02em]"
            >
              Upload a document
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="min-h-9 border border-ink/35 px-3 text-sm text-ink hover:bg-cream"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {/* Remounting on each open clears any previous result and file input. */}
          {open ? (
            <UploadDocumentForm
              categories={categories}
              clientId={clientId}
              onUploaded={() => setOpen(false)}
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
