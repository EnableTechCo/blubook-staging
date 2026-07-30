"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { createFolder } from "@/features/documents/actions";

// Creates a folder, or a subfolder when `parentId` is supplied. A native
// <dialog> gives focus trapping and Esc-to-close; the form submits a server
// action and the page revalidates.
export function NewFolderDialog({
  parentId,
  label,
}: {
  parentId?: string;
  label?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const isSub = Boolean(parentId);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 items-center gap-1.5 border border-ink px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-cream"
      >
        {label ?? (isSub ? "New subfolder" : "New folder")} <span aria-hidden="true">+</span>
      </button>

      <dialog
        ref={ref}
        aria-labelledby="new-folder-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === ref.current) setOpen(false);
        }}
        className="w-[min(26rem,calc(100vw-2rem))] border border-ink bg-paper p-0 text-ink backdrop:bg-ink/55"
      >
        <div className="border-b border-ink px-6 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-rust">
            Document archive
          </p>
          <h2 id="new-folder-title" className="mt-1 font-heading text-[1.6rem] font-normal tracking-[-0.02em]">
            {isSub ? "New subfolder" : "New folder"}
          </h2>
        </div>

        <form
          action={createFolder}
          onSubmit={() => setOpen(false)}
          className="space-y-4 px-6 py-5"
        >
          {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
          <div>
            <label htmlFor="folder-name" className={labelStyles}>
              Folder name
            </label>
            <input
              id="folder-name"
              name="name"
              type="text"
              required
              maxLength={80}
              autoFocus
              className={fieldStyles}
            />
          </div>
          <div className="flex items-center gap-4">
            <Button type="submit">
              Create <span aria-hidden="true">→</span>
            </Button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-ink/55 hover:text-rust"
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
