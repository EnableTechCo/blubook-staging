import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";
import {
  getDocumentArchive,
  getDocumentFolders,
  type DocumentFolder,
  type DocumentRow,
} from "@/services/dashboard";
import { UploadDocumentDialog } from "@/features/documents/UploadDocumentDialog";
import { NewFolderDialog } from "@/features/documents/NewFolderDialog";
import { FolderMenu } from "@/features/documents/FolderMenu";
import { MoveDocumentControl } from "@/features/documents/MoveDocumentControl";
import { Empty, formatDate, titleCase, WorkspaceHeader } from "@/features/dashboard/ui";

export const metadata: Metadata = { title: "Document Archive · BluBook" };
export const dynamic = "force-dynamic";

const UNFILED = "unfiled";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [documents, folders, { folder: folderParam, error }] = await Promise.all([
    getDocumentArchive(),
    getDocumentFolders(),
    searchParams,
  ]);

  const isProvider = profile.user_type === "service_provider";
  const isClient = profile.user_type === "client";
  const canManage = isClient || isProvider;

  const parents = folders.filter((f) => !f.parent_id);
  const childrenOf = (id: string) => folders.filter((f) => f.parent_id === id);
  const byId = new Map(folders.map((f) => [f.id, f]));

  // A folder's count includes documents filed under its children.
  const idsUnder = (folder: DocumentFolder) => [folder.id, ...childrenOf(folder.id).map((c) => c.id)];
  const countUnder = (folder: DocumentFolder) => {
    const ids = idsUnder(folder);
    return documents.filter((d) => d.folder_id && ids.includes(d.folder_id)).length;
  };
  const unfiledCount = documents.filter((d) => !d.folder_id).length;

  const current = folderParam && folderParam !== UNFILED ? byId.get(folderParam) : null;
  const isUnfiledView = folderParam === UNFILED;

  const href = (id?: string) =>
    id ? (`/dashboard/documents?folder=${id}` as const) : ("/dashboard/documents" as const);

  // Documents visible in the current view.
  const visibleDocs: DocumentRow[] = isUnfiledView
    ? documents.filter((d) => !d.folder_id)
    : current
      ? documents.filter((d) => d.folder_id === current.id)
      : [];

  const subfolders = current && !current.parent_id ? childrenOf(current.id) : [];
  const parent = current?.parent_id ? byId.get(current.parent_id) : null;

  const cardBase =
    "group relative flex flex-col justify-between border border-ink bg-paper p-4 transition-colors hover:bg-cream/45 focus-within:bg-cream/45";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow={isProvider ? "Shared with you" : "Your records"}
        title="Document Archive"
        description={
          isProvider
            ? "Documents from your assigned requests, filed into folders you control."
            : "Your documents, organised into folders you can rename, nest and add to."
        }
        aside={
          <div className="flex flex-wrap items-center gap-3">
            {canManage ? <NewFolderDialog parentId={current?.parent_id ? undefined : current?.id} /> : null}
            {isClient ? (
              <UploadDocumentDialog folders={folders} defaultFolderId={current?.id} />
            ) : null}
          </div>
        }
      />

      {error ? (
        <p
          role="alert"
          className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink"
        >
          {error}
        </p>
      ) : null}

      {/* Breadcrumb */}
      <nav aria-label="Folder path" className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={href()}
          className={`border-b ${!current && !isUnfiledView ? "border-ink font-semibold text-ink" : "border-transparent text-ink/55 hover:border-rust hover:text-rust"}`}
        >
          Archive
        </Link>
        {parent ? (
          <>
            <span aria-hidden="true" className="text-ink/30">
              /
            </span>
            <Link
              href={href(parent.id)}
              className="border-b border-transparent text-ink/55 hover:border-rust hover:text-rust"
            >
              {parent.name}
            </Link>
          </>
        ) : null}
        {current ? (
          <>
            <span aria-hidden="true" className="text-ink/30">
              /
            </span>
            <span className="font-semibold text-ink">{current.name}</span>
          </>
        ) : null}
        {isUnfiledView ? (
          <>
            <span aria-hidden="true" className="text-ink/30">
              /
            </span>
            <span className="font-semibold text-ink">Unfiled</span>
          </>
        ) : null}
      </nav>

      {/* Root: main folders as cards */}
      {!current && !isUnfiledView ? (
        <section className="space-y-4">
          {parents.length === 0 ? (
            <div className="border-y border-ink bg-paper">
              <Empty>No folders yet. Create one to start organising.</Empty>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {parents.map((folder) => (
                <li key={folder.id} className={cardBase}>
                  <div className="flex items-start justify-between gap-2">
                    <Link href={href(folder.id)} className="min-w-0 flex-1 focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <span className="block truncate font-heading text-xl font-normal text-ink">
                        {folder.name}
                      </span>
                    </Link>
                    {canManage ? (
                      <span className="relative z-10">
                        <FolderMenu folderId={folder.id} name={folder.name} />
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-6 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
                    <span>
                      {childrenOf(folder.id).length > 0
                        ? `${childrenOf(folder.id).length} subfolder${childrenOf(folder.id).length === 1 ? "" : "s"}`
                        : "Folder"}
                    </span>
                    <span>{countUnder(folder)} docs</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Link
            href={href(UNFILED)}
            className="flex items-center justify-between border border-dashed border-ink/40 bg-paper px-4 py-3 text-sm text-ink/70 transition-colors hover:border-ink hover:bg-cream/45"
          >
            <span className="font-semibold">Unfiled documents</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
              {unfiledCount} docs
            </span>
          </Link>
        </section>
      ) : null}

      {/* A parent folder: its subfolders, plus documents filed directly here */}
      {current && !current.parent_id ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-normal text-ink">{current.name}</h2>
            {canManage ? (
              <div className="flex items-center gap-2">
                <NewFolderDialog parentId={current.id} />
                <FolderMenu folderId={current.id} name={current.name} />
              </div>
            ) : null}
          </div>

          {subfolders.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subfolders.map((folder) => (
                <li key={folder.id} className={cardBase}>
                  <div className="flex items-start justify-between gap-2">
                    <Link href={href(folder.id)} className="min-w-0 flex-1 focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <span className="block truncate font-heading text-lg font-normal text-ink">
                        {folder.name}
                      </span>
                    </Link>
                    {canManage ? (
                      <span className="relative z-10">
                        <FolderMenu folderId={folder.id} name={folder.name} />
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-6 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
                    {countUnder(folder)} docs
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <DocumentTable
            documents={visibleDocs}
            folders={folders}
            canManage={canManage}
            emptyLabel={
              subfolders.length > 0
                ? "No documents filed directly in this folder."
                : "Nothing filed here yet."
            }
          />
        </div>
      ) : null}

      {/* A subfolder, or the Unfiled view: just documents */}
      {(current && current.parent_id) || isUnfiledView ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-normal text-ink">
              {isUnfiledView ? "Unfiled documents" : current?.name}
            </h2>
            {canManage && current?.parent_id ? (
              <FolderMenu folderId={current.id} name={current.name} />
            ) : null}
          </div>
          <DocumentTable
            documents={visibleDocs}
            folders={folders}
            canManage={canManage}
            emptyLabel={isUnfiledView ? "Everything is filed." : "Nothing filed here yet."}
          />
        </div>
      ) : null}
    </div>
  );
}

function DocumentTable({
  documents,
  folders,
  canManage,
  emptyLabel,
}: {
  documents: DocumentRow[];
  folders: DocumentFolder[];
  canManage: boolean;
  emptyLabel: string;
}) {
  return (
    <div className="border-y border-ink bg-paper">
      {documents.length === 0 ? (
        <Empty>{emptyLabel}</Empty>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink bg-cream/45 font-mono text-[9px] uppercase tracking-[0.1em] text-cobalt">
              <th className="px-4 py-3 font-medium">Document</th>
              {canManage ? <th className="hidden px-4 py-3 font-medium sm:table-cell">Folder</th> : null}
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Expires</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Download</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-ink last:border-b-0">
                <td className="px-4 py-3">
                  <span className="block font-body text-sm font-semibold text-ink">{doc.title}</span>
                  <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.08em] text-ink/45">
                    {titleCase(doc.category)} · {formatDate(doc.created_at)}
                    {doc.expires_at ? (
                      <span className="lg:hidden"> · Expires {formatDate(doc.expires_at)}</span>
                    ) : null}
                  </span>
                  {canManage ? (
                    <span className="mt-2 block sm:hidden">
                      <MoveDocumentControl
                        documentId={doc.id}
                        folders={folders}
                        currentFolderId={doc.folder_id}
                      />
                    </span>
                  ) : null}
                </td>
                {canManage ? (
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <MoveDocumentControl
                      documentId={doc.id}
                      folders={folders}
                      currentFolderId={doc.folder_id}
                    />
                  </td>
                ) : null}
                <td className="hidden px-4 py-3 text-sm text-ink/60 lg:table-cell">
                  {doc.expires_at ? formatDate(doc.expires_at) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/api/documents/${doc.id}`}
                    className="border-b border-ink font-body text-xs font-semibold text-ink hover:border-cobalt hover:text-cobalt"
                  >
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
