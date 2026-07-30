"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { deleteFolder, renameFolder } from "@/features/documents/actions";

// Rename / delete controls for a folder the caller owns. Kept out of the card's
// main click target so opening a folder and managing it stay separate gestures.
export function FolderMenu({ folderId, name }: { folderId: string; name: string }) {
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Manage folder ${name}`}
        className="min-h-8 min-w-8 border border-ink/30 bg-paper px-2 font-mono text-sm leading-none text-ink/60 transition-colors hover:border-ink hover:text-ink"
      >
        ⋯
      </button>

      <dialog
        ref={ref}
        aria-labelledby="folder-menu-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === ref.current) setOpen(false);
        }}
        className="w-[min(26rem,calc(100vw-2rem))] border border-ink bg-paper p-0 text-ink backdrop:bg-ink/55"
      >
        <div className="border-b border-ink px-6 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-rust">Folder</p>
          <h2
            id="folder-menu-title"
            className="mt-1 truncate font-heading text-[1.6rem] font-normal tracking-[-0.02em]"
          >
            {name}
          </h2>
        </div>

        <div className="space-y-6 px-6 py-5">
          <form action={renameFolder} onSubmit={() => setOpen(false)} className="space-y-3">
            <input type="hidden" name="folderId" value={folderId} />
            <div>
              <label htmlFor={`rename-${folderId}`} className={labelStyles}>
                Rename
              </label>
              <input
                id={`rename-${folderId}`}
                name="name"
                type="text"
                required
                maxLength={80}
                defaultValue={name}
                className={fieldStyles}
              />
            </div>
            <Button type="submit" className="min-h-9 px-4 text-xs">
              Save name
            </Button>
          </form>

          <form action={deleteFolder} onSubmit={() => setOpen(false)} className="border-t border-ink/15 pt-5">
            <input type="hidden" name="folderId" value={folderId} />
            <p className="mb-3 text-[13px] leading-6 text-ink/60">
              Deleting a folder is only allowed once it is empty — move its documents and subfolders
              out first.
            </p>
            <button
              type="submit"
              className="inline-flex min-h-9 items-center border border-clay px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-clay transition-colors hover:bg-clay hover:text-paper"
            >
              Delete folder
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
