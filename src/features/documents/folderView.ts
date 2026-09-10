import type { DocumentFolder, DocumentRow } from "@/services/documents";

/**
 * How the documents page resolves the folder tree it is asked to show.
 *
 * This was forty lines of logic inside an async page component — counts that
 * include a folder's children, a sentinel for "unfiled", and which documents
 * are visible in the current view — none of it testable without rendering the
 * page against mocked services. It is pure, so it lives here and the page
 * only renders what it returns.
 */

/** The query-string value that means "documents in no folder". */
export const UNFILED = "unfiled";

interface FolderView {
  parents: DocumentFolder[];
  childrenOf: (id: string) => DocumentFolder[];
  byId: Map<string, DocumentFolder>;
  /** A folder's count includes documents filed under its children. */
  countUnder: (folder: DocumentFolder) => number;
  unfiledCount: number;
  /** The folder being viewed, or null at the root and in the unfiled view. */
  current: DocumentFolder | null;
  isUnfiledView: boolean;
  /** Documents visible in the current view: none at the root, where folders show instead. */
  visibleDocs: DocumentRow[];
}

export function buildFolderView(args: {
  folders: DocumentFolder[];
  documents: DocumentRow[];
  folderParam: string | undefined;
}): FolderView {
  const { folders, documents, folderParam } = args;

  const parents = folders.filter((f) => !f.parent_id);
  const childrenOf = (id: string) => folders.filter((f) => f.parent_id === id);
  const byId = new Map(folders.map((f) => [f.id, f]));

  const idsUnder = (folder: DocumentFolder) => [folder.id, ...childrenOf(folder.id).map((c) => c.id)];
  const countUnder = (folder: DocumentFolder) => {
    const ids = idsUnder(folder);
    return documents.filter((d) => d.folder_id && ids.includes(d.folder_id)).length;
  };
  const unfiledCount = documents.filter((d) => !d.folder_id).length;

  const isUnfiledView = folderParam === UNFILED;
  const current = folderParam && !isUnfiledView ? (byId.get(folderParam) ?? null) : null;

  const visibleDocs: DocumentRow[] = isUnfiledView
    ? documents.filter((d) => !d.folder_id)
    : current
      ? documents.filter((d) => d.folder_id === current.id)
      : [];

  return { parents, childrenOf, byId, countUnder, unfiledCount, current, isUnfiledView, visibleDocs };
}
