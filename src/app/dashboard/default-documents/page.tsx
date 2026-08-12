import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Empty, formatDate, Section, WorkspaceHeader } from "@/features/dashboard/ui";
import { getCurrentProfile } from "@/services/profiles";
import { requireStaffRoute } from "@/services/staffRole";
import { createClient } from "@/lib/supabase/server";
import { setDefaultDocumentActive } from "@/features/catalogue/defaultDocumentActions";
import { AddDefaultDocumentForm } from "@/features/catalogue/AddDefaultDocumentForm";

export const metadata: Metadata = { title: "Default documents · BluBook" };
export const dynamic = "force-dynamic";

interface LibraryRow {
  id: string;
  name: string;
  description: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  target_folder_slug: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  service_groups: { name: string } | null;
}

export default async function DefaultDocumentsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (await requireStaffRoute("/dashboard/default-documents")) redirect("/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("default_documents")
    .select(
      "id,name,description,mime_type,size_bytes,target_folder_slug,sort_order,active,created_at,service_groups(name)",
    )
    .order("sort_order")
    .order("name")
    .returns<LibraryRow[]>();
  const { data: groups } = await supabase
    .from("service_groups")
    .select("id,name")
    .eq("active", true)
    .order("name")
    .returns<{ id: string; name: string }[]>();

  const documents = data ?? [];
  const activeCount = documents.filter((document) => document.active).length;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Catalogue"
        title="Default documents"
        description="Documents every new client receives when their account goes live. Each is delivered as its own request and stays open until the client acknowledges receipt."
      />

      <Section
        title="Library"
        subtitle={`${activeCount} document${activeCount === 1 ? "" : "s"} sent at onboarding`}
      >
        {documents.length === 0 ? (
          <Empty>
            No default documents yet. New clients receive a welcome message but no documents.
          </Empty>
        ) : (
          <ul className="divide-y divide-ink border-y border-ink">
            {documents.map((document) => (
              <li
                key={document.id}
                className={`flex flex-wrap items-start justify-between gap-4 py-4 ${
                  document.active ? "" : "opacity-55"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-body text-sm font-semibold text-ink">{document.name}</p>
                  {document.description ? (
                    <p className="mt-1 max-w-xl text-xs leading-5 text-ink/60">
                      {document.description}
                    </p>
                  ) : null}
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-rust">
                    {document.service_groups
                      ? `${document.service_groups.name} document`
                      : "BluBook document · every client"}
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink/45">
                    {document.target_folder_slug
                      ? `Files into ${document.target_folder_slug}`
                      : "Left unfiled"}
                    {" · "}
                    {formatDate(document.created_at)}
                    {document.active ? "" : " · Retired"}
                  </p>
                </div>
                <form action={setDefaultDocumentActive}>
                  <input type="hidden" name="id" value={document.id} />
                  <input type="hidden" name="active" value={document.active ? "false" : "true"} />
                  <button
                    type="submit"
                    className="inline-flex min-h-9 items-center border border-ink/45 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-cream"
                  >
                    {document.active ? "Retire" : "Restore"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Add a document"
        subtitle="Sent to clients onboarded from now on; existing clients are unaffected"
      >
        <AddDefaultDocumentForm workGroups={groups ?? []} />
      </Section>
    </div>
  );
}
