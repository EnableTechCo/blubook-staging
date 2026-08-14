import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { QuotationBuilder } from "@/features/quotations/QuotationBuilder";
import { getQuotations } from "@/features/quotations/queries";
import { getClientProducts } from "@/features/products/queries";
import { getLetterheadState } from "@/features/letterhead/queries";
import { getSalesPipeline } from "@/features/sales/queries";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Create quotation · BluBook" };
export const dynamic = "force-dynamic";

export default async function QuotationPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard");

  const [products, quotations, letterhead, pipeline] = await Promise.all([
    getClientProducts(),
    getQuotations(),
    getLetterheadState(),
    getSalesPipeline(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Transact"
        title="Create quotation"
        description="Priced from your product list and printed onto your letterhead. A copy is filed in your archive under Sales · Quotations."
      />
      <QuotationBuilder
        products={products.filter((product) => product.active)}
        quotations={quotations}
        letterheadGaps={letterhead.gaps}
        sources={pipeline.sources}
        categories={pipeline.categories}
      />
    </div>
  );
}
