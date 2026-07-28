import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";
import {
  getDocumentArchive,
  getDocumentCategories,
  type DocumentCategory,
  type DocumentRow,
} from "@/services/dashboard";
import { UploadDocumentForm } from "@/features/documents/UploadDocumentForm";
import { formatDate, titleCase } from "@/features/dashboard/ui";

export const metadata: Metadata = { title: "Document Archive · BluBook" };
export const dynamic = "force-dynamic";

const UNCATEGORISED = "uncategorised";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [documents, categories] = await Promise.all([
    getDocumentArchive(),
    getDocumentCategories(),
  ]);

  const { category: selectedSlug } = await searchParams;
  const isProvider = profile.user_type === "service_provider";
  const isClient = profile.user_type === "client";

  const parents = categories.filter((c) => !c.parent_id);
  const childrenOf = (parentId: string) => categories.filter((c) => c.parent_id === parentId);
  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  // A section shows its own documents plus those filed under its children.
  const idsFor = (category: DocumentCategory): string[] => [
    category.id,
    ...childrenOf(category.id).map((c) => c.id),
  ];
  const countFor = (category: DocumentCategory) => {
    const ids = idsFor(category);
    return documents.filter((d) => d.category_id && ids.includes(d.category_id)).length;
  };
  const uncategorisedCount = documents.filter((d) => !d.category_id).length;

  const selected = selectedSlug && selectedSlug !== UNCATEGORISED ? bySlug.get(selectedSlug) : null;
  const visible: DocumentRow[] =
    selectedSlug === UNCATEGORISED
      ? documents.filter((d) => !d.category_id)
      : selected
        ? documents.filter((d) => d.category_id && idsFor(selected).includes(d.category_id))
        : documents;

  const filterHref = (slug?: string) =>
    slug ? (`/dashboard/documents?category=${slug}` as const) : ("/dashboard/documents" as const);

  const railLink = (active: boolean) =>
    `flex items-baseline justify-between gap-3 px-3 py-2 font-body text-sm transition-colors ${
      active
        ? "border-l-[3px] border-l-cobalt bg-cobalt-wash font-semibold text-ink"
        : "border-l-[3px] border-l-transparent text-slate-600 hover:bg-paper hover:text-ink"
    }`;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
          {isProvider ? "Shared with you" : "Your records"}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-medium tracking-[-0.03em] text-ink">
          Document Archive
        </h1>
        <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-slate-600">
          {isProvider
            ? "Documents attached to the requests assigned to you."
            : "Every document held for your business, filed by area."}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Filter by category" className="border border-ink/30 bg-paper-light/95 py-2">
          <Link href={filterHref()} className={railLink(!selectedSlug)}>
            <span>All documents</span>
            <span className="font-mono text-[10px] text-slate-500">{documents.length}</span>
          </Link>

          {parents.map((parent) => {
            const children = childrenOf(parent.id);
            return (
              <div key={parent.id} className="mt-1">
                <Link href={filterHref(parent.slug)} className={railLink(selectedSlug === parent.slug)}>
                  <span>{parent.name}</span>
                  <span className="font-mono text-[10px] text-slate-500">{countFor(parent)}</span>
                </Link>
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={filterHref(child.slug)}
                    className={`${railLink(selectedSlug === child.slug)} pl-7 text-[13px]`}
                  >
                    <span>{child.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">{countFor(child)}</span>
                  </Link>
                ))}
              </div>
            );
          })}

          {uncategorisedCount > 0 ? (
            <div className="mt-1 border-t border-ink/12 pt-1">
              <Link
                href={filterHref(UNCATEGORISED)}
                className={railLink(selectedSlug === UNCATEGORISED)}
              >
                <span>Uncategorised</span>
                <span className="font-mono text-[10px] text-slate-500">{uncategorisedCount}</span>
              </Link>
            </div>
          ) : null}
        </nav>

        <section className="min-w-0">
          <div className="border border-ink/40 bg-paper-light/95">
            {visible.length === 0 ? (
              <p className="border-l-[3px] border-sun bg-paper px-4 py-3 font-body text-sm text-slate-600">
                {documents.length === 0
                  ? isProvider
                    ? "No documents shared with you."
                    : "No documents yet."
                  : "Nothing filed here yet."}
              </p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-ink/20 font-mono text-[9px] uppercase tracking-[0.1em] text-cobalt">
                    <th className="px-4 py-3 font-medium">Document</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Filed under</th>
                    <th className="hidden px-4 py-3 font-medium lg:table-cell">Expires</th>
                    <th className="px-4 py-3 font-medium">
                      <span className="sr-only">Download</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((doc) => (
                    <tr key={doc.id} className="border-b border-ink/12 last:border-b-0">
                      <td className="px-4 py-3">
                        <span className="block font-body text-sm font-semibold text-ink">
                          {doc.title}
                        </span>
                        <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.08em] text-slate-500">
                          {titleCase(doc.category)} · {formatDate(doc.created_at)}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 font-body text-sm text-slate-600 sm:table-cell">
                        {doc.document_categories?.name ?? (
                          <span className="text-slate-400">Uncategorised</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 font-body text-sm text-slate-600 lg:table-cell">
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

          {isClient ? (
            <div className="mt-6 border border-ink/30 bg-paper-light/95 p-5">
              <h2 className="font-heading text-xl font-medium tracking-[-0.02em] text-ink">
                Add a document
              </h2>
              <p className="mb-4 mt-1 font-body text-xs text-slate-600">
                Filed into your archive and visible to BluBook staff.
              </p>
              <UploadDocumentForm categories={categories} />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
