import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "@/features/dashboard/ui";
import { ProductListWorkspace } from "@/features/products/ProductListWorkspace";
import { getClientProducts } from "@/features/products/queries";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Product list · BluBook" };
export const dynamic = "force-dynamic";

// The client's own products, at the client's prices — kept apart from the
// BluBook catalogue, which is staff's to price.
export default async function ProductListPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "client") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Sales"
        title="Product list"
        description="What you sell, at your prices. Quotations are built from this list, so keeping it current is what keeps a quotation right."
      />
      <ProductListWorkspace products={await getClientProducts()} />
    </div>
  );
}
