"use client";

import { useRef } from "react";
import { fileDocument } from "@/features/documents/actions";
import type { DocumentFolder } from "@/services/dashboard";

// A per-row folder picker. Changing it files (or unfiles, when "Unfiled" is
// chosen) the document in the caller's own tree, then the archive revalidates.
export function MoveDocumentControl({
  documentId,
  folders,
  currentFolderId,
}: {
  documentId: string;
  folders: DocumentFolder[];
  currentFolderId: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const parents = folders.filter((f) => !f.parent_id);
  const childrenOf = (parentId: string) => folders.filter((f) => f.parent_id === parentId);

  return (
    <form ref={formRef} action={fileDocument}>
      <input type="hidden" name="documentId" value={documentId} />
      <label className="sr-only" htmlFor={`move-${documentId}`}>
        Move to folder
      </label>
      <select
        id={`move-${documentId}`}
        name="folderId"
        defaultValue={currentFolderId ?? ""}
        onChange={() => formRef.current?.requestSubmit()}
        className="min-h-8 max-w-[11rem] border border-ink/30 bg-cream px-2 py-1 font-body text-xs text-ink outline-none focus:border-rust"
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
    </form>
  );
}
