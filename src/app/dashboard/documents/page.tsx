import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";
import { getDocumentArchive } from "@/services/dashboard";
import { Empty, formatDate, Section, titleCase } from "@/features/dashboard/ui";
import { UploadDocumentForm } from "@/features/documents/UploadDocumentForm";

export const metadata: Metadata = { title: "Document Archive · BluBook" };
export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const documents = await getDocumentArchive();
  const isClient = profile.user_type === "client";
  const isProvider = profile.user_type === "service_provider";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-sky-700">Document Archive</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Documents</h1>
      </header>

      <Section
        title="Documents"
        subtitle={
          isProvider
            ? "Documents attached to your assigned requests"
            : "Your document archive"
        }
      >
        {documents.length === 0 ? (
          <Empty>{isProvider ? "No documents shared with you." : "No documents yet."}</Empty>
        ) : (
          <ul className="space-y-1">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">
                  {doc.title}{" "}
                  <span className="text-xs text-slate-400">
                    · {titleCase(doc.category)}
                    {doc.expires_at ? ` · expires ${formatDate(doc.expires_at)}` : ""}
                  </span>
                </span>
                <a
                  href={`/api/documents/${doc.id}`}
                  className="text-xs font-medium text-sky-700 hover:underline"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}

        {isClient ? (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="mb-2 text-xs font-medium text-slate-500">Add a document</p>
            <UploadDocumentForm />
          </div>
        ) : null}
      </Section>
    </div>
  );
}
