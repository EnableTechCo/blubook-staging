import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/services/profiles";
import { getStaffOnboardings } from "@/services/dashboard";
import { updateComplianceStatus } from "@/features/onboarding/actions";
import { UploadDocumentForm } from "@/features/documents/UploadDocumentForm";
import { Badge, Empty, Section, titleCase } from "@/features/dashboard/ui";

export const metadata: Metadata = { title: "Onboardings · BluBook" };
export const dynamic = "force-dynamic";

const STATUSES = ["outstanding", "received", "verified", "rejected"] as const;

export default async function OnboardingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "staff") redirect("/dashboard");

  const onboardings = await getStaffOnboardings();

  return (
    <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:underline">
          ← Back to control desk
        </Link>
        <h1 className="mt-3 mb-6 text-2xl font-bold tracking-tight">Onboardings & compliance</h1>

        {onboardings.length === 0 ? (
          <Empty>No onboardings yet.</Empty>
        ) : (
          <div className="space-y-4">
            {onboardings.map((o) => (
              <Section
                key={o.id}
                title={o.clients?.business_name ?? "Client"}
                subtitle={`Onboarding · ${titleCase(o.status)}`}
              >
                {o.onboarding_documents.length === 0 ? (
                  <Empty>No compliance documents on this onboarding.</Empty>
                ) : (
                  <ul className="space-y-2">
                    {o.onboarding_documents.map((d) => (
                      <li key={d.id} className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-slate-700">
                            {d.compliance_document_types?.name ?? "Document"}
                          </span>
                          <Badge status={d.status} />
                          {d.documents.map((doc) => (
                            <a
                              key={doc.id}
                              href={`/api/documents/${doc.id}`}
                              className="text-xs font-medium text-sky-700 hover:underline"
                            >
                              View file
                            </a>
                          ))}
                          {d.documents.length === 0 && o.clients ? (
                            <UploadDocumentForm
                              compact
                              clientId={o.clients.id}
                              onboardingDocumentId={d.id}
                              documentTypeId={d.document_type_id ?? undefined}
                              defaultTitle={d.compliance_document_types?.name}
                            />
                          ) : null}
                        </div>
                        <form action={updateComplianceStatus} className="flex items-center gap-2">
                          <input type="hidden" name="documentId" value={d.id} />
                          <select
                            key={d.status}
                            name="status"
                            defaultValue={d.status}
                            className="rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-sky-500"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {titleCase(s)}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded-md bg-sky-700 px-3 py-1 text-sm font-medium text-white hover:bg-sky-800"
                          >
                            Update
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            ))}
          </div>
        )}
    </div>
  );
}
