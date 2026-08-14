import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { BankingDetailsForm } from "@/features/company/BankingDetailsForm";
import { getBankingDetails } from "@/features/company/queries";
import { LetterheadForm } from "@/features/letterhead/LetterheadForm";
import { getLetterheadState } from "@/features/letterhead/queries";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Create letterhead · BluBook" };
export const dynamic = "force-dynamic";

// Where the client keeps what only the client should hold. The letterhead will
// join this page, since it is built from the same details.
async function LetterheadSection() {
  const { settings, data, gaps } = await getLetterheadState();
  return <LetterheadForm settings={settings} gaps={gaps} ready={data !== null} />;
}

export default async function CompanyProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Transact"
        title="Create letterhead"
        description="Your paper. Set it up once and every quotation and notice you raise is printed onto it."
      />
      <BankingDetailsForm details={await getBankingDetails()} />
      <LetterheadSection />
    </div>
  );
}
