import Link from "next/link";
import type { CustomerFolder } from "@/features/documents/partnerArchive";
import { Empty } from "@/components/ui/Workspace";
import { formatDate } from "@/lib/time";

/**
 * The partner's archive: a card per customer, and inside a customer, the
 * documents grouped by what they are. Nothing to manage — the arrangement is
 * derived, so there are no folders to create, rename or file into.
 */

const FROM_LABEL = { you: "You", customer: "Customer", bluebook: "BluBook" } as const;

const cardBase =
  "group relative flex flex-col justify-between rounded-2xl border border-ink/10 bg-paper-light/75 p-4 shadow-surface transition-[background-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-cobalt-wash/45 focus-within:bg-cobalt-wash/45";

export function PartnerArchiveView({
  folders,
  customerId,
}: {
  folders: CustomerFolder[];
  /** The open folder, from the query string; undefined shows the customer cards. */
  customerId?: string;
}) {
  const current = customerId ? folders.find((folder) => folder.clientId === customerId) : undefined;

  return (
    <>
      <nav aria-label="Folder path" className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/dashboard/documents"
          className={`border-b ${current ? "border-transparent text-ink/55 hover:border-rust hover:text-rust" : "border-ink font-semibold text-ink"}`}
        >
          Customers
        </Link>
        {current ? (
          <>
            <span aria-hidden="true" className="text-ink/30">/</span>
            <span className="font-semibold text-ink">{current.name}</span>
          </>
        ) : null}
      </nav>

      {!current ? (
        folders.length === 0 ? (
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/75 shadow-surface">
            <Empty>
              No customer folders yet. A folder appears for each customer the moment a document passes
              between you on one of their requests.
            </Empty>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <li key={folder.clientId} className={cardBase}>
                <Link
                  href={{ pathname: "/dashboard/documents", query: { customer: folder.clientId } }}
                  className="min-w-0 focus:outline-none"
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  <span className="block truncate font-heading text-xl font-normal text-ink">{folder.name}</span>
                  {folder.reference && folder.reference !== folder.name ? (
                    <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-ink/50">
                      {folder.reference}
                    </span>
                  ) : null}
                </Link>
                <div className="mt-6 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
                  <span>
                    {folder.requestCount} request{folder.requestCount === 1 ? "" : "s"} · last {formatDate(folder.lastActivity)}
                  </span>
                  <span>{folder.documentCount} docs</span>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="font-heading text-2xl font-normal text-ink">{current.name}</h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/50">
              {current.reference && current.reference !== current.name ? `${current.reference} · ` : ""}
              {current.documentCount} document{current.documentCount === 1 ? "" : "s"} across {current.requestCount} request
              {current.requestCount === 1 ? "" : "s"}
            </p>
          </div>

          {current.groups.map((group) => (
            <section key={group.kind} aria-labelledby={`kind-${group.kind}`} className="space-y-3">
              <div>
                <h3 id={`kind-${group.kind}`} className="font-heading text-lg font-normal text-ink">
                  {group.label}
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
                    {group.documents.length}
                  </span>
                </h3>
                <p className="text-xs leading-5 text-ink/55">{group.description}</p>
              </div>
              <div className="workspace-table-frame">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-ink/8 bg-cream/70 font-mono text-[9px] uppercase tracking-[0.1em] text-cobalt">
                      <th className="px-4 py-3 font-medium">Document</th>
                      <th className="hidden px-4 py-3 font-medium sm:table-cell">Request</th>
                      <th className="hidden px-4 py-3 font-medium lg:table-cell">From</th>
                      <th className="hidden px-4 py-3 font-medium lg:table-cell">Date</th>
                      <th className="px-4 py-3 font-medium"><span className="sr-only">Download</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.documents.map((document) => (
                      <tr key={document.id} className="border-b border-ink/8 last:border-b-0">
                        <td className="px-4 py-3">
                          <span className="block font-body text-sm font-semibold text-ink">{document.title}</span>
                          <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.08em] text-ink/45 sm:hidden">
                            {document.request.reference} · {FROM_LABEL[document.from]} · {formatDate(document.createdAt)}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          <Link
                            href={`/dashboard/reports/requests/${document.request.id}`}
                            className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-cobalt hover:text-cobalt-deep"
                          >
                            {document.request.reference}
                          </Link>
                          {document.request.workOrder ? (
                            <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
                              {document.request.workOrder}
                            </span>
                          ) : null}
                        </td>
                        <td className="hidden px-4 py-3 text-sm text-ink/60 lg:table-cell">{FROM_LABEL[document.from]}</td>
                        <td className="hidden px-4 py-3 text-sm text-ink/60 lg:table-cell">{formatDate(document.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={`/api/documents/${document.id}`}
                            className="border-b border-ink font-body text-xs font-semibold text-ink hover:border-cobalt hover:text-cobalt"
                          >
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
